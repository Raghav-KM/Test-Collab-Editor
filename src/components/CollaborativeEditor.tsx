import {
    Monaco,
    Editor as MonacoEditor,
    OnChange,
    OnMount,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import { get_character_sequence, perform_normal_operation } from "../lseq/crdt";
import { Range } from "monaco-editor";
import { crdt_node, crdt_operation, normal_operation } from "../lseq/types";
import { get_position_by_id, perform_crdt_operation } from "../lseq/crdt";
import { useSocket } from "../hooks/ws";
import { ServerMessageType } from "../../backend/src/types";

export const CollaborativeEditor = ({
    root_crdt,
    root_editorRef,
}: {
    root_crdt: crdt_node;
    root_editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
}) => {
    const [text, setText] = useState("");
    useEffect(() => {
        setText("");
    }, []);

    let ignoreOnChangeHandler = useRef(false);
    let decorationIds: string[] = [];

    const addCursorDecoration = (
        editor: editor.IStandaloneCodeEditor,
        lineNumber: number,
        column: number
    ) => {
        decorationIds = editor.deltaDecorations(decorationIds, [
            {
                range: new Range(lineNumber, column, lineNumber, column),
                options: {
                    className: "border-s-2 border-red-500",
                    isWholeLine: false,
                },
            },
        ]);

        return decorationIds;
    };

    const perform_opertation_locally = (
        operation: crdt_operation,
        editor: editor.IStandaloneCodeEditor,
        root_crdt: crdt_node
    ) => {
        const initial_position = editor.getPosition();
        perform_crdt_operation(root_crdt, operation);

        const insert_index = get_position_by_id(root_crdt, operation.id);
        const insert_position = editor.getModel()?.getPositionAt(insert_index);

        if (!insert_position || !initial_position) return;
        // editor.setValue(get_character_sequence(root_crdt));
        // console.log(insert_position);
        let editor_operation;

        if (operation.type == "delete") {
            if (editor.getModel()?.getValue()[insert_index] == "\n") {
                editor_operation = {
                    range: new Range(
                        insert_position.lineNumber,
                        insert_position.column,
                        insert_position.lineNumber + 1,
                        1
                    ),
                    text: "",
                    forceMoveMarkers: true,
                };
            } else {
                editor_operation = {
                    range: new Range(
                        insert_position.lineNumber,
                        insert_position.column,
                        insert_position.lineNumber,
                        insert_position.column + 1
                    ),
                    text: "",
                    forceMoveMarkers: true,
                };
            }
        } else if (operation.type == "insert") {
            editor_operation = {
                range: new Range(
                    insert_position.lineNumber,
                    insert_position.column,
                    insert_position.lineNumber,
                    insert_position.column
                ),
                text: operation.value,
                forceMoveMarkers: true,
            };
        }

        // console.log(editor_operation);
        editor.getModel()?.applyEdits([editor_operation!]);

        const post_insert_index =
            operation.type == "insert" ? insert_index + 1 : insert_index;

        const post_insert_position = editor
            .getModel()
            ?.getPositionAt(post_insert_index);

        addCursorDecoration(
            editor,
            post_insert_position!.lineNumber,
            post_insert_position!.column
        );
    };

    const handleOnMessage = (message: MessageEvent<any>) => {
        try {
            const parsed_message = JSON.parse(
                message.data
            ) as ServerMessageType;

            ignoreOnChangeHandler.current = true;
            perform_opertation_locally(
                parsed_message.operation,
                root_editorRef.current!,
                root_crdt
            );
            setText(get_character_sequence(root_crdt));
        } catch (ex) {
            console.log("Invalid Server Message");
        }
    };

    const socket = useSocket(handleOnMessage);

    const handleOnChange = (
        _value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        if (ignoreOnChangeHandler.current == true) {
            ignoreOnChangeHandler.current = false;
            return;
        }
        if (ev.isFlush) return;

        let local_operation: normal_operation | null;
        let global_operation: crdt_operation | null;

        if (ev.changes[0].text != "") {
            local_operation = {
                pos: ev.changes[0].rangeOffset,
                value: ev.changes[0].text.replace(/\r\n/g, "\n"),
                type: "insert",
                priority: root_crdt.id.priority,
            };
        } else {
            local_operation = {
                pos: ev.changes[0].rangeOffset,
                value: "",
                type: "delete",
                priority: root_crdt.id.priority,
            };
        }
        // console.log(ev.changes[0].range);
        const op_id = perform_normal_operation(root_crdt, local_operation);
        global_operation = {
            id: op_id,
            value: local_operation.value,
            type: local_operation.type,
        };

        setText(get_character_sequence(root_crdt));

        socket?.send(
            JSON.stringify({
                operation: global_operation,
            })
        );
    };

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="w-full h-1/2">
                {socket ? (
                    <Editor
                        editorRef={root_editorRef}
                        onChange={handleOnChange}
                    />
                ) : (
                    <div> </div>
                )}
            </div>
            <div className="w-full h-1/3 bg-white p-3 font-mono text-lg">
                {JSON.stringify(text)}
            </div>
        </div>
    );
};

const Editor = ({
    editorRef,
    onChange,
}: {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
    onChange: OnChange;
}) => {
    const handelOnMount: OnMount = (
        edtr: editor.IStandaloneCodeEditor,
        _monaco: Monaco
    ) => {
        editorRef.current = edtr;
        editorRef.current.getModel()?.setValue("\n");
    };

    return (
        <div className="w-full h-full bg-white p-2">
            <MonacoEditor
                height="100%"
                width="100%"
                theme="vs-light"
                options={{
                    fontSize: 18,
                    suggestOnTriggerCharacters: false,
                    quickSuggestions: false,
                    autoClosingBrackets: "never",
                    autoClosingQuotes: "never",
                }}
                onMount={handelOnMount}
                onChange={onChange}
                defaultValue=""
            />
        </div>
    );
};

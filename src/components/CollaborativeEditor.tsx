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
    let editorDomNode: HTMLElement | null;
    let prevtooltip: HTMLDivElement | null;

    const addCursorDecoration = (
        lineNumber: number,
        column: number,
        tooltipText: string
    ) => {
        const editor = root_editorRef.current;
        if (!editor) return;

        decorationIds = editor.deltaDecorations(decorationIds, []);

        decorationIds = editor.deltaDecorations(decorationIds, [
            {
                range: new Range(lineNumber, column, lineNumber, column),
                options: {
                    className:
                        "border-s-4 border-red-600 opacity-80 rounded-lg",
                    isWholeLine: false,
                },
            },
        ]);

        const position = editor.getScrolledVisiblePosition({
            lineNumber,
            column,
        });

        if (position) {
            editorDomNode = editor.getDomNode();
            if (!editorDomNode) return;

            const tooltip = document.createElement("div");
            tooltip.className =
                "px-[6px] py-[4px] absolute bg-red-600 rounded-tr-lg rounded-br-lg rounded-bl-lg z-10 text-[10px] text-white opacity-80 font-bold shadow-lg";
            tooltip.textContent = tooltipText;
            tooltip.style.pointerEvents = "none";
            tooltip.style.left = `${position.left}px`;
            tooltip.style.top = `${
                position.top + editor.getTopForLineNumber(1) + 12
            }px`;

            if (prevtooltip) editorDomNode.removeChild(prevtooltip);
            editorDomNode.appendChild(tooltip);
            prevtooltip = tooltip;
        }
    };

    const perform_opertation_locally = (
        operation: crdt_operation,
        root_crdt: crdt_node
    ) => {
        if (!root_editorRef.current || !root_editorRef.current.getModel())
            return;

        const editor: editor.IStandaloneCodeEditor = root_editorRef.current;
        const model: editor.ITextModel = editor.getModel()!;

        perform_crdt_operation(root_crdt, operation);

        const initial_pos = editor.getPosition();
        const operation_index = get_position_by_id(root_crdt, operation.id);
        const operation_pos = model.getPositionAt(operation_index);

        if (!initial_pos) return;
        // editor.setValue(get_character_sequence(root_crdt));
        // console.log(operation_pos);

        let editor_operation;
        if (operation.type == "delete") {
            if (model.getValue()[operation_index] == "\n") {
                editor_operation = {
                    range: new Range(
                        operation_pos.lineNumber,
                        operation_pos.column,
                        operation_pos.lineNumber + 1,
                        1
                    ),
                    text: "",
                    forceMoveMarkers: true,
                };
            } else {
                editor_operation = {
                    range: new Range(
                        operation_pos.lineNumber,
                        operation_pos.column,
                        operation_pos.lineNumber,
                        operation_pos.column + 1
                    ),
                    text: "",
                    forceMoveMarkers: true,
                };
            }
        } else if (operation.type == "insert") {
            editor_operation = {
                range: new Range(
                    operation_pos.lineNumber,
                    operation_pos.column,
                    operation_pos.lineNumber,
                    operation_pos.column
                ),
                text: operation.value,
                forceMoveMarkers: true,
            };
        }

        // console.log(editor_operation);
        model.applyEdits([editor_operation!]);

        const post_operation_index =
            operation.type == "insert" ? operation_index + 1 : operation_index;

        const post_operation_pos = model.getPositionAt(post_operation_index);

        addCursorDecoration(
            post_operation_pos.lineNumber,
            post_operation_pos.column,
            "Other User"
        );
    };

    const handleOnMessage = (message: MessageEvent<any>) => {
        try {
            const parsed_message = JSON.parse(
                message.data
            ) as ServerMessageType;

            ignoreOnChangeHandler.current = true;
            perform_opertation_locally(parsed_message.operation, root_crdt);
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
                value: ev.changes[0].text,
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
        // console.log(ev.changes[0]);
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
        editorRef.current.getModel()?.setEOL(0);
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
                    autoIndent: "none",
                    tabSize: 4,
                }}
                onMount={handelOnMount}
                onChange={onChange}
                defaultValue=""
            />
        </div>
    );
};

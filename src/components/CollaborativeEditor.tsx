import {
    Editor as MonacoEditor,
    OnChange,
    OnMount,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useEffect, useState } from "react";
import { crdt_node } from "../lseq/types";
import { get_character_sequence, perform_normal_operation } from "../lseq/crdt";

import { ServerMessageType } from "../../backend/src/types";
import { perform_opertation_locally } from "./CursorEditor";

const BACKEND_URL = "wss://collab-editor.project-raghav.in";

export const CollaborativeEditor = ({
    root_crdt,
    root_editorRef,
}: {
    root_crdt: crdt_node;
    root_editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
}) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    const [text, setText] = useState("");

    useEffect(() => {
        setText("");
        const new_socket = new WebSocket(`${BACKEND_URL}`);

        new_socket.onopen = () => {
            console.log("Web Socket Connection Successfull");
            setSocket(new_socket);
        };

        new_socket.onmessage = (message) => {
            try {
                const parsed_message = JSON.parse(
                    message.data
                ) as ServerMessageType;

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

        new_socket.onclose = () => {
            console.log("Disconnected from server");
            setSocket(null);
        };

        return () => {
            new_socket.close();
        };
    }, []);

    const handleOnChange = (
        _value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        if (ev.isFlush) return;

        let op_id;
        let operation = {};

        if (ev.changes[0].text != "") {
            op_id = perform_normal_operation(root_crdt, {
                pos: ev.changes[0].rangeOffset,
                value: ev.changes[0].text,
                type: "insert",
                priority: root_crdt.id.priority,
            });

            operation = {
                id: op_id,
                value: ev.changes[0].text,
                type: "insert",
            };
        } else {
            op_id = perform_normal_operation(root_crdt, {
                pos: ev.changes[0].rangeOffset,
                value: "",
                type: "delete",
                priority: root_crdt.id.priority,
            });
            operation = {
                id: op_id,
                value: "",
                type: "delete",
            };
        }

        // console.log(JSON.stringify(_value));
        setText(get_character_sequence(root_crdt));
        socket?.send(
            JSON.stringify({
                operation: operation,
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
            <div className="w-full h-1/2 bg-white p-3 font-mono text-lg">
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
    const handelOnMount: OnMount = (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
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
                }}
                onMount={handelOnMount}
                onChange={onChange}
                defaultValue=""
            />
        </div>
    );
};

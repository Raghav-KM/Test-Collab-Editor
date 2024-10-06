import {
    Editor as MonacoEditor,
    OnChange,
    OnMount,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useEffect, useState } from "react";
import { crdt_node } from "../lseq/types";
import {
    get_character_sequence,
    perform_crdt_operation,
    perform_normal_operation,
} from "../lseq/crdt";

import { ServerMessageType } from "../../backend/src/types";

const BACKEND_URL = "ws://13.233.75.200:4000";
export const CollaborativeEditor = ({
    root_crdt,
    root_editorRef,
}: {
    root_crdt: crdt_node;
    root_editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
}) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    useEffect(() => {
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
                // console.log(parsed_message);
                perform_crdt_operation(root_crdt, parsed_message.operation);
                root_editorRef.current?.setValue(
                    get_character_sequence(root_crdt)
                );
                // console.log(root_crdt);
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
        value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        value = value;
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

        socket?.send(
            JSON.stringify({
                operation: operation,
            })
        );
    };

    return (
        <div className="w-full h-full">
            {socket ? (
                <Editor editorRef={root_editorRef} onChange={handleOnChange} />
            ) : (
                <div> </div>
            )}
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
    };
    return (
        <div className="w-full h-full bg-white p-2">
            <MonacoEditor
                height="100%"
                width="100%"
                theme="vs-light"
                options={{ fontSize: 18 }}
                onMount={handelOnMount}
                onChange={onChange}
                defaultValue=""
            />
        </div>
    );
};

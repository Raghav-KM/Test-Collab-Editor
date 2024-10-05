import {
    Editor as MonacoEditor,
    OnChange,
    OnMount,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React from "react";
import { crdt_node } from "../../../CRDTs/LSEQ/src/types";
import {
    get_character_sequence,
    perform_crdt_operation,
    perform_normal_operation,
} from "../../../CRDTs/LSEQ/src/crdt";

export const CollaborativeEditor = ({
    root_crdt,
    root_editorRef,
    other_crdt,
    other_editorRef,
}: {
    root_crdt: crdt_node;
    root_editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
    other_crdt: crdt_node;
    other_editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
}) => {
    const handleOnChange = (
        value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        value = value;
        if (ev.isFlush) return;
        // Perform Operation on the Local CRDT

        let op_id;
        console.log("Local Operation : ", root_crdt.id.priority);
        if (ev.changes[0].text != "") {
            op_id = perform_normal_operation(root_crdt, {
                pos: ev.changes[0].rangeOffset,
                value: ev.changes[0].text,
                type: "insert",
                priority: root_crdt.id.priority,
            });
            perform_crdt_operation(other_crdt, {
                id: op_id,
                value: ev.changes[0].text,
                type: "insert",
            });
        } else {
            op_id = perform_normal_operation(root_crdt, {
                pos: ev.changes[0].rangeOffset,
                value: "",
                type: "delete",
                priority: root_crdt.id.priority,
            });
            perform_crdt_operation(other_crdt, {
                id: op_id,
                value: "",
                type: "delete",
            });
        }
        other_editorRef.current?.setValue(get_character_sequence(other_crdt));
    };

    return (
        <div className="w-full h-full">
            <Editor editorRef={root_editorRef} onChange={handleOnChange} />
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

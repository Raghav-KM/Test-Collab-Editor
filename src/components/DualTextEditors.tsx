import {
    Editor as MonacoEditor,
    OnChange,
    OnMount,
} from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useRef } from "react";
import {
    get_character_sequence,
    init_tree,
    perform_normal_operation,
} from "../../../CRDTs/LSEQ/src/crdt";

export const DualTextEditors = () => {
    const root_cdtr = init_tree();

    const editorRefA = useRef<editor.IStandaloneCodeEditor>();
    const editorRefB = useRef<editor.IStandaloneCodeEditor>();

    const handeOnChangeEditorA = (
        value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        if (ev.isFlush) {
            return;
        }
        let op_id;
        if (ev.changes[0].text != "") {
            op_id = perform_normal_operation(
                { ...root_cdtr },
                {
                    pos: ev.changes[0].rangeOffset,
                    value: ev.changes[0].text,
                    type: "insert",
                }
            );
        } else {
            op_id = perform_normal_operation(
                { ...root_cdtr },
                {
                    pos: ev.changes[0].rangeOffset,
                    value: "",
                    type: "delete",
                }
            );
        }

        console.log(ev);
        editorRefB.current?.setValue(get_character_sequence(root_cdtr));
        console.log(root_cdtr);
    };
    const handeOnChangeEditorB = (
        value: string | undefined,
        ev: editor.IModelContentChangedEvent
    ) => {
        if (ev.isFlush) {
            return;
        }
        let op_id;
        if (ev.changes[0].text != "") {
            op_id = perform_normal_operation(
                { ...root_cdtr },
                {
                    pos: ev.changes[0].rangeOffset,
                    value: ev.changes[0].text,
                    type: "insert",
                }
            );
        } else {
            op_id = perform_normal_operation(
                { ...root_cdtr },
                {
                    pos: ev.changes[0].rangeOffset,
                    value: "",
                    type: "delete",
                }
            );
        }

        console.log(ev);
        editorRefA.current?.setValue(get_character_sequence(root_cdtr));
        console.log(root_cdtr);
    };

    return (
        <div className="w-full h-full bg-black flex flex-row justify-center gap-12">
            <Editor editorRef={editorRefA} onChange={handeOnChangeEditorA} />
            <Editor editorRef={editorRefB} onChange={handeOnChangeEditorB} />
        </div>
    );
};

const Editor = ({
    editorRef,
    onChange,
}: {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | undefined>;
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

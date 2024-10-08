import { useRef } from "react";
import { init_tree } from "../lseq/crdt";
import { CollaborativeEditor } from "../components/CollaborativeEditor";
import { editor } from "monaco-editor";

export const DualEdtorPage = () => {
    const root_crdtA = init_tree(0);
    // const root_crdtB = init_tree(1);
    const editorRefA = useRef<editor.IStandaloneCodeEditor | null>(null);
    // const editorRefB = useRef<editor.IStandaloneCodeEditor | null>(null);

    return (
        <div className="w-full h-full flex flex-row gap-4 p-4">
            <CollaborativeEditor
                root_crdt={root_crdtA}
                root_editorRef={editorRefA}
            />
        </div>
    );
};

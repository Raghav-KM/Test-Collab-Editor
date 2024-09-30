import { useRef } from "react";
import { init_tree } from "../../../CRDTs/LSEQ/src/crdt";
import { CollaborativeEditor } from "../components/CollaborativeEditor";
import { editor } from "monaco-editor";

export const DaulEdtorPage = () => {
    const root_crdtA = init_tree();
    const root_crdtB = init_tree();
    const editorRefA = useRef<editor.IStandaloneCodeEditor | null>(null);
    const editorRefB = useRef<editor.IStandaloneCodeEditor | null>(null);

    return (
        <div className="w-full h-full flex flex-row gap-4 p-4">
            <div className="w-[50vw] h-full bg-white">
                <CollaborativeEditor
                    root_crdt={root_crdtA}
                    root_editorRef={editorRefA}
                    other_crdt={root_crdtB}
                    other_editorRef={editorRefB}
                />
            </div>
            <div className="w-[50vw] h-full bg-white">
                <CollaborativeEditor
                    root_crdt={root_crdtB}
                    root_editorRef={editorRefB}
                    other_crdt={root_crdtA}
                    other_editorRef={editorRefA}
                />
            </div>
        </div>
    );
};

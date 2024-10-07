import { OnChange, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef, useState } from "react";
export const CursorEditor = () => {
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleOnChange: OnChange = () => {};

    const interval_function = () => {
        editorRef.current?.setValue("[" + editorRef.current.getValue());
    };

    const handleOnStart = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        const id = setInterval(interval_function, 3000);
        setIntervalId(id);
    };

    const handleOnStop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    return (
        <div className="w-1/2 h-full flex flex-col gap-2">
            <div className="w-full flex-grow ">
                <Editor editorRef={editorRef} onChange={handleOnChange} />
            </div>
            <div className="h-24 w-full bg-white flex flex-row justify-center items-center gap-4">
                <button
                    className="bg-gray-500 px-8 py-4 rounded-lg text-white shadow-md font-bold hover:bg-gray-400"
                    onClick={handleOnStart}
                >
                    START
                </button>
                <button
                    className="bg-gray-500 px-8 py-4 rounded-lg text-white shadow-md font-bold hover:bg-gray-400"
                    onClick={handleOnStop}
                >
                    STOP
                </button>
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

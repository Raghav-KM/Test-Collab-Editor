import { OnChange, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { Range } from "monaco-editor";
export const CursorEditor = () => {
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleOnChange: OnChange = () => {};

    const convertIndexToPosition = (
        model: editor.ITextModel,
        index: number
    ) => {
        return model.getPositionAt(index);
    };

    const addCursorDecoration = (
        editor: editor.IStandaloneCodeEditor,
        lineNumber: number,
        column: number
    ) => {
        // Create the decoration object
        const decoration = editor.deltaDecorations(
            [],
            [
                {
                    range: new Range(lineNumber, column, lineNumber, column),
                    options: {
                        className: "border-s-2 border-red-500",
                        isWholeLine: false,
                    },
                },
            ]
        );

        return decoration;
    };

    const random_insert_operation = (
        text: string
    ): {
        insert_index: number;
        inserted_char: string;
        updated_text: string;
    } => {
        const characters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\n";

        const insert_index = Math.floor(Math.random() * (text.length + 1));

        const inserted_char =
            characters[Math.floor(Math.random() * characters.length)];

        const updated_text =
            text.slice(0, insert_index) +
            inserted_char +
            text.slice(insert_index);

        return {
            insert_index,
            inserted_char,
            updated_text,
        };
    };

    const interval_function = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const position = editor.getPosition();
        if (!position) return;

        const { insert_index, inserted_char, updated_text } =
            random_insert_operation(editor.getValue());

        const insert_position = convertIndexToPosition(
            editor.getModel()!,
            insert_index
        );

        editor.setValue(updated_text);
        const old_selection = editor.getSelections()![0];

        if (inserted_char == "\n") {
            if (insert_position.lineNumber == position.lineNumber) {
                if (insert_position.column >= position.column) {
                    editor.setPosition(position);
                } else {
                    editor.setPosition({
                        lineNumber: position.lineNumber + 1,
                        column: position.column - insert_position.column,
                    });
                }
            } else if (insert_position.lineNumber < position.lineNumber) {
                editor.setPosition({
                    ...position,
                    lineNumber: position.lineNumber + 1,
                });
            } else {
                editor.setPosition(position);
            }
        } else {
            if (insert_position.lineNumber == position.lineNumber) {
                if (insert_position.column <= position.column) {
                    editor.setPosition({
                        ...position,
                        column: position.column + 1,
                    });
                } else {
                    editor.setPosition(position);
                }
            } else {
                editor.setPosition(position);
            }
        }
        addCursorDecoration(
            editor,
            insert_position.lineNumber,
            insert_position.column
        );
    };

    const handleOnStart = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        const id = setInterval(interval_function, 500);
        setIntervalId(id);
    };

    const handleOnStop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-2">
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
                defaultValue="Hello From the DEFAULT VALUE"
            />
        </div>
    );
};

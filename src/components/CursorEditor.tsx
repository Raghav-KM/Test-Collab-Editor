import { OnChange, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { Range } from "monaco-editor";
import { crdt_node, crdt_operation } from "../lseq/types";
import {
    get_character_sequence,
    get_position_by_id,
    perform_crdt_operation,
} from "../lseq/crdt";

const addCursorDecoration = (
    editor: editor.IStandaloneCodeEditor,
    lineNumber: number,
    column: number
) => {
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

export const perform_opertation_locally = (
    operation: crdt_operation,
    editor: editor.IStandaloneCodeEditor,
    root_crdt: crdt_node
) => {
    const initial_position = editor.getPosition();
    perform_crdt_operation(root_crdt, operation);
    const insert_index = get_position_by_id(root_crdt, operation.id);
    const insert_position = editor.getModel()?.getPositionAt(insert_index);
    if (!insert_position || !initial_position) return;
    editor.setValue(get_character_sequence(root_crdt));

    if (operation.value == "\n") {
        if (insert_position.lineNumber == initial_position.lineNumber) {
            if (insert_position.column >= initial_position.column) {
                editor.setPosition(initial_position);
            } else {
                editor.setPosition({
                    lineNumber: initial_position.lineNumber + 1,
                    column: initial_position.column - insert_position.column,
                });
            }
        } else if (insert_position.lineNumber < initial_position.lineNumber) {
            editor.setPosition({
                ...initial_position,
                lineNumber: initial_position.lineNumber + 1,
            });
        } else {
            editor.setPosition(initial_position);
        }
    } else {
        if (insert_position.lineNumber == initial_position.lineNumber) {
            if (insert_position.column <= initial_position.column) {
                editor.setPosition({
                    ...initial_position,
                    column: initial_position.column + 1,
                });
            } else {
                editor.setPosition(initial_position);
            }
        } else {
            editor.setPosition(initial_position);
        }
    }
    console.log(insert_position);
    addCursorDecoration(
        editor,
        insert_position.lineNumber,
        insert_position.column + 1
    );
};

export const CursorEditor = () => {
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const handleOnChange: OnChange = () => {};

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
        random_insert_operation("");
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

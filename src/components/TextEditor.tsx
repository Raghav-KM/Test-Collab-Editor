import { useEffect, useRef, useState } from "react";

const useUpdateEditorDiv = (
    code: string,
    editorDivRef: React.RefObject<HTMLDivElement>
) => {
    useEffect(() => {
        updateEditorDivCode(code);
    }, [code]);

    const updateEditorDivCode = (code: string) => {
        if (!editorDivRef.current) return;
        const editorDiv = editorDivRef.current as HTMLDivElement;
        editorDiv.innerHTML = `<u>${code}</u>`;
    };
};

const useCursorPosition = (
    code: string,
    textAreaRef: React.RefObject<HTMLTextAreaElement>
) => {
    const [cursor, setCursor] = useState({ end: 0 });

    useEffect(() => {
        if (!textAreaRef.current) return;
        const textArea = textAreaRef.current;
        console.log(document.getSelection());
        setCursor({
            end: textArea.selectionEnd,
        });
    }, [code]);
    return cursor;
};

export const TextEditor = () => {
    const editorDivRef = useRef<HTMLDivElement>(null);
    const textAreaRefA = useRef<HTMLTextAreaElement>(null);
    const textAreaRefB = useRef<HTMLTextAreaElement>(null);

    const [codeA, setCodeA] = useState("");
    const [codeB, setCodeB] = useState("");

    useUpdateEditorDiv(codeA, editorDivRef);
    const endA = useCursorPosition(codeA, textAreaRefA).end;
    const endB = useCursorPosition(codeB, textAreaRefB).end;

    return (
        <div className="w-full h-full bg-white p-4 flex flex-col gap-1">
            <div className="w-full h-1/2 relative border-2 border-black">
                <div
                    className="w-full h-full absolute text-black p-4 text-xl font-bold font-mono whitespace-pre"
                    ref={editorDivRef}
                ></div>
                <div className="w-full h-full absolute bg-transparent">
                    <textarea
                        className="w-full h-full p-4 outline-none bg-transparent text-xl font-bold font-mono text-transparent caret-black"
                        onChange={(e) => {
                            setCodeA(e.target.value);
                        }}
                        spellCheck={false}
                        ref={textAreaRefA}
                    />
                </div>
            </div>
            <div className="w-full h-8 border-2 border-black p-1 text-sm font-bold font-mono">
                {`Pos: ${endA}`}
            </div>
            <div className="w-full h-1/2 border-2 border-black">
                <textarea
                    className="w-full h-full p-4 outline-none text-xl font-bold font-mono"
                    onChange={(e) => {
                        setCodeB(e.target.value);
                    }}
                    spellCheck={false}
                    ref={textAreaRefB}
                />
            </div>
            <div className="w-full h-8 border-2 border-black p-1 text-sm font-bold font-mono">
                {`Pos: ${endB}`}
            </div>
        </div>
    );
};

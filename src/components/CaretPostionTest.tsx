import React, { useRef, useState } from "react";

const updateTextArea = (
    code: string,
    textAreaRef: React.RefObject<HTMLTextAreaElement>
) => {
    if (!textAreaRef.current) return;
    const textArea = textAreaRef.current;
    textArea.value = code;
};

const updateCaretPosition = (
    code: string,
    textAreaRef: React.RefObject<HTMLTextAreaElement>
): string => {
    if (!textAreaRef.current) return code;
    const textArea = textAreaRef.current;
    const end_pos = textArea.selectionEnd;
    return code.substring(0, end_pos);
};

export const CaretPostionTest = () => {
    const textAreaRefA = useRef<HTMLTextAreaElement>(null);
    const textAreaRefB = useRef<HTMLTextAreaElement>(null);

    const position = { x: 0, y: 0 };
    const [caretCode, setCaretCode] = useState("");

    return (
        <div className="w-full h-full bg-white p-4 flex flex-col gap-1">
            <div className="w-full h-1/2 relative border-2 border-black">
                <div className="w-full h-full max-w-[100%] p-4 pe-0 absolute bg-black">
                    <span className="w-fit max-w-[98%] h-fit text-xl font-bold font-mono text-transparent whitespace-break-spaces border">
                        {caretCode}
                    </span>
                    <span className="text-xl font-bold font-mono text-purple-500 m-[-4px]">
                        |
                    </span>
                </div>
                <div className="w-full h-full absolute">
                    <textarea
                        className="w-full h-full p-4 outline-none text-xl font-bold font-mono text-red-500 caret-white bg-transparent"
                        onChange={(e) => {
                            const new_code = e.target.value;
                            updateTextArea(new_code, textAreaRefB);
                        }}
                        spellCheck={false}
                        ref={textAreaRefA}
                    />
                </div>
            </div>
            <div className="w-full h-8 border-2 border-black p-1 text-sm font-bold font-mono">
                {`Pos: (${position.x},${position.y})`}
            </div>
            <div className="w-full h-1/2 relative border-2 border-black">
                <div className="w-full h-full absolute">
                    <textarea
                        className="w-full h-full p-4 outline-none text-xl font-bold font-mono text-black-500 caret-black bg-transparent"
                        onChange={(e) => {
                            const new_code = e.target.value;
                            updateTextArea(new_code, textAreaRefA);
                            setCaretCode(
                                updateCaretPosition(new_code, textAreaRefB)
                            );
                        }}
                        spellCheck={false}
                        ref={textAreaRefB}
                    />
                </div>
            </div>
            <div className="w-full h-8 border-2 border-black p-1 text-sm font-bold font-mono">
                {`Pos: (${position.x},${position.y})`}
            </div>
        </div>
    );
};

import { useEffect, useState } from "react";

const BACKEND_URL = "wss://collab-editor.project-raghav.in";

export const useSocket = (
    onMessageHandler: (message: MessageEvent<any>) => void
) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const new_socket = new WebSocket(`${BACKEND_URL}`);

        new_socket.onopen = () => {
            console.log("Web Socket Connection Successfull");
            setSocket(new_socket);
        };

        new_socket.onmessage = onMessageHandler;

        new_socket.onclose = () => {
            console.log("Disconnected from server");
            setSocket(null);
        };

        return () => {
            new_socket.close();
        };
    }, []);
    return socket;
};

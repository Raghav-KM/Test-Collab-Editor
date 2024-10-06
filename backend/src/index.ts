import express from "express";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { ClientMessageType, ServerMessageType } from "./types";

const PORT = 4000;
const app = express();
const http_server = app.listen(PORT, () => {
    console.log(`Listening to Port ${PORT}`);
});

const wss = new WebSocket.Server({ server: http_server });
let global_connection_count = 0;
const connection: {
    [key: string]: {
        ws: WebSocket;
        client_id: number;
    };
} = {};

wss.on("connection", (ws: WebSocket) => {
    const uuid = uuidv4();
    init_connection(uuid, ws);
    init_message_handler(uuid, ws);
    init_close_handler(uuid, ws);
});

const init_connection = (uuid: string, ws: WebSocket) => {
    global_connection_count++;

    connection[uuid] = { ws: ws, client_id: global_connection_count };
    console.log(
        `Connection Established ${uuid} - Client ${connection[uuid].client_id}`
    );
};
const init_close_handler = (uuid: string, ws: WebSocket) => {
    ws.on("close", () => {
        console.log(
            `Connection Closed ${uuid} - Client ${connection[uuid].client_id}`
        );
        delete connection[uuid];
    });
};

const init_message_handler = (uuid: string, ws: WebSocket) => {
    ws.on("message", (message: any) => {
        try {
            const paresed_message = JSON.parse(message) as ClientMessageType;
            handle_message(uuid, paresed_message);
        } catch (ex) {
            console.log(
                `Unable to Parse Message from Client ${connection[uuid].client_id}`
            );
        }
    });
};

const handle_message = (uuid: string, client_message: ClientMessageType) => {
    console.log(
        `Message from Client ${connection[uuid].client_id} : ${JSON.stringify(
            client_message.operation
        )}`
    );
    broadcast_message(uuid, client_message);
};

const broadcast_message = (
    exclude_uuid: string,
    message: ClientMessageType
) => {
    Object.keys(connection).forEach((key) => {
        if (key != exclude_uuid) {
            const ws = connection[key].ws;
            const server_message: ServerMessageType = {
                operation: message.operation,
            };
            ws.send(JSON.stringify(server_message));
        }
    });
};

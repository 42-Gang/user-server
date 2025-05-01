import { Namespace } from "socket.io";
import { socketMiddleware } from "../utils/middleware.js";
import { handleConnection } from "./connection.handler.js";

export default async function startFriendNamespace(namespace: Namespace) {
    namespace.use(socketMiddleware);

    namespace.on('connection', (socket) => handleConnection(socket, namespace));
}
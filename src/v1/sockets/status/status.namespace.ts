import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';
import { socketMiddleware } from '../utils/middleware.js';

export default function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);

  namespace.on('connection', (socket: Socket) => {
    console.log(`🟢 [/status] Connected: ${socket.id}, ${socket.data.userId}`);

    socket.on('disconnect', () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
    });
  });
}

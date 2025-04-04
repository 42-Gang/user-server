import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';

export default function statusNamespace(namespace: Namespace) {
  namespace.on('connection', (socket: Socket) => {
    console.log(`🟢 [/status] Connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
    });
  });
}

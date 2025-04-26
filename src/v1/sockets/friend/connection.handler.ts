import { Namespace, Socket } from 'socket.io';

export async function friendHandleConnection(socket: Socket, namespace: Namespace) {
  try {
    const userId = socket.data.userId;
    console.log(`🟢 [/status] Connected: ${socket.id}, ${userId}`);
  } catch (error) {
    console.error(`Error in connection handler: ${error}`);
  }
}

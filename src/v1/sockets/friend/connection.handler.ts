import { Namespace, Socket } from "socket.io";

export async function handleConnection(
  socket: Socket,
  namespace: Namespace,
) {
    try {
        const userId = socket.data.userId;
        console.log(`🟢 [/friend] Connected: ${socket.id}, ${userId}`);
        
        socket.on('disconnect', () => {
            console.log(`🔴 [/friend] Disconnected: ${socket.id}`);
        });
    } catch (error) {
        console.error(`friend 소켓 연결을 실패하였습니다. ${error}`);
    }
}
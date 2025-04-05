import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';
import { socketMiddleware } from '../utils/middleware.js';
import { redis } from '../../../plugins/redis.js';
import { sendStatus, connectProducer, disconnectProducer } from './producer.js';
import { startConsumer } from './consumer.js';
import { userStatus } from './status.schema.js';

export default function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
  const userSockets = new Map<string, string>(); // 또는 userId → socket 객체 저장
  startConsumer(namespace, userSockets);

  namespace.on('connection', async (socket: Socket) => {
    console.log(`🟢 [/status] Connected: ${socket.id}, ${socket.data.userId}`);
    const userId = socket.data.userId;

    userSockets.set(userId, socket.id);
    console.log(`${userId} connected with socket ${socket.id}`);

    const friends = await redis.smembers(`user:${userId}:friends`);
    console.log(`🟢 [/status] Friends: ${friends}`);

    for (const friend of friends) {
      const status = await redis.get(`user:${friend}:status`);
      socket.emit('friend-status', { userId: friend, status: status || userStatus.ONLINE });
      socket.join(`user-status-${friend}`);
    }

    // 온라인 상태 Kafka로 전송
    await connectProducer();
    await sendStatus(userId, userStatus.ONLINE);

    socket.on('disconnect', async () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
      await sendStatus(userId, userStatus.OFFLINE);
      await disconnectProducer();
    });
  });
}

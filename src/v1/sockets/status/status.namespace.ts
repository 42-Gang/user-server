import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';
import { socketMiddleware } from '../utils/middleware.js';
import { redis } from '../../../plugins/redis.js';
import { sendStatus } from './producer.js';
import { startConsumer } from './consumer.js';

export default function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
  startConsumer(namespace);


  namespace.on('connection', async (socket: Socket) => {
    console.log(`🟢 [/status] Connected: ${socket.id}, ${socket.data.userId}`);
    const userId = socket.data.userId;

    const friends = await redis.smembers(`user:${userId}:friends`);
    console.log(`🟢 [/status] Friends: ${friends}`);

    for (const friend of friends) {
      const status = await redis.get(`user:${friend}:status`);
      socket.emit('friend-status', { userId: friend, status: status || 'offline' });
      socket.join(`user-status-${friend}`);
    }

    // 온라인 상태 Kafka로 전송
    await sendStatus(userId, 'online');

    socket.on('disconnect', async () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
      await sendStatus(userId, 'offline');
    });
  });
}

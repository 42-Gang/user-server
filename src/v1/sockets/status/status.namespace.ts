import { Namespace, Socket } from 'socket.io';
import * as console from 'node:console';
import { socketMiddleware } from '../utils/middleware.js';
import { Redis } from 'ioredis';

export default function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  namespace.on('connection', async (socket: Socket) => {
    console.log(`🟢 [/status] Connected: ${socket.id}, ${socket.data.userId}`);

    const friends = await redis.smembers(`user:${socket.data.userId}:friends`);
    console.log(`🟢 [/status] Friends: ${friends}`);

    for (const friend of friends) {
      const status = await redis.get(`user:${friend}:status`);
      socket.emit('friend-status', { userId: friend, status: status || 'offline' });
      socket.join(`user-status-${friend}`);
    }

    // 온라인 상태 Kafka로 전송
    // await sendStatus(userId, 'online');

    socket.on('disconnect', () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
      // await sendStatus(userId, 'offline');
    });
  });
}

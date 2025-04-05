import { Namespace, Socket } from 'socket.io';
import { socketMiddleware } from '../utils/middleware.js';
import { redis } from '../../../plugins/redis.js';
import { sendStatus, startProducer, stopProducer } from './producer.js';
import { startConsumer } from './consumer.js';
import { userStatus } from './status.schema.js';
import FriendCacheRedis from '../../storage/cache/redis/friend.cache.repository.js';
import StatusService from './status.service.js';
import { TypeOf } from 'zod';
import { friendsSchema } from './friends.schema.js';

export default async function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
  const userSockets = new Map<string, string>();
  const friendCacheRepository = new FriendCacheRedis(redis);
  const statusService = new StatusService(friendCacheRepository);

  await startProducer();
  startConsumer(namespace, userSockets, friendCacheRepository);

  namespace.on('connection', async (socket: Socket) => {
    try {
      const userId = socket.data.userId;
      console.log(`🟢 [/status] Connected: ${socket.id}, ${userId}`);

      userSockets.set(userId, socket.id);
      redis.set(`user:${userId}:status`, userStatus.ONLINE);

      const friends = await statusService.fetchFriends(userId);
      await joinFriendStatusRooms(socket, userId, friends);

      await sendStatus(userId, userStatus.ONLINE);

      socket.on('disconnect', async () => {
        console.log(`🔴 [/status] Disconnected: ${socket.id}`);
        await sendStatus(userId, userStatus.OFFLINE);
        userSockets.delete(userId);
        await stopProducer();
      });
    } catch (error) {
      console.error(`Error in connection handler: ${error}`);
    }
  });
}

async function joinFriendStatusRooms(
  socket: Socket,
  userId: number,
  friends: TypeOf<typeof friendsSchema>,
) {
  for (const friend of friends) {
    const status = await redis.get(`user:${friend.id}:status`);
    socket.emit('friend-status', {
      userId: friend.id,
      status: status || 'OFFLINE',
    });
    socket.join(`user-status-${friend.id}`);
  }
}

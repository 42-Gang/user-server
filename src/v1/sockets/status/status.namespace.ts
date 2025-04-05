import { Namespace } from 'socket.io';
import { socketMiddleware } from '../utils/middleware.js';
import { redis } from '../../../plugins/redis.js';
import { startConsumer } from './kafka/consumer.js';
import FriendCacheRedis from '../../storage/cache/redis/friend.cache.repository.js';
import StatusService from './status.service.js';
import { handleConnection } from './connection.handler.js';

export default async function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
  const userSockets = new Map<string, string>();

  const friendCacheRepository = new FriendCacheRedis(redis);
  const statusService = new StatusService(friendCacheRepository);

  startConsumer(namespace, userSockets, friendCacheRepository);

  namespace.on('connection', (socket) =>
    handleConnection(socket, namespace, userSockets, statusService),
  );
}

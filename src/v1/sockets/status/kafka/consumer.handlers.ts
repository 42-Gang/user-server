import { Namespace } from 'socket.io';
import { redis } from '../../../../plugins/redis.js';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { friendAddMessage, userStatusMessage } from './messages.schema.js';
import { TypeOf } from 'zod';

export async function handleUserStatusMessage(
  message: TypeOf<typeof userStatusMessage>,
  namespace: Namespace,
) {
  const { userId, status } = message;

  console.log(`🔄 User ${userId} is now ${status}`);
  await redis.set(`user:${userId}:status`, status);
  namespace.to(`user-status-${userId}`).emit('friend-status', { userId, status });
}

export async function handleFriendAddMessage(
  message: TypeOf<typeof friendAddMessage>,
  namespace: Namespace,
  userSockets: Map<string, string>,
  friendCacheRepository: FriendCacheInterface,
) {
  const { userAId, userBId } = message;
  await friendCacheRepository.addFriend(Number(userAId), { friendId: Number(userBId) });
  await friendCacheRepository.addFriend(Number(userBId), { friendId: Number(userAId) });

  const userASocketHash = userSockets.get(userAId);
  const userBSocketHash = userSockets.get(userBId);

  console.log(userSockets, userAId, userBId);
  if (userASocketHash) {
    namespace.sockets.get(userASocketHash)?.join(`user-status-${userBId}`);
  }
  if (userBSocketHash) {
    namespace.sockets.get(userBSocketHash)?.join(`user-status-${userAId}`);
  }

  for (const id of [userAId, userBId]) {
    const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
    namespace.to(`user-status-${id}`).emit('friend-status', { userId: id, status });
  }
}

export async function blockFriend(message: TypeOf<typeof friendAddMessage>, namespace: Namespace) {
  const { userAId, userBId } = message;
  await redis.del(`user:${userAId}:friend:${userBId}`);
  await redis.del(`user:${userBId}:friend:${userAId}`);
  console.log(`User ${userAId} blocked user ${userBId}`);

  const userASocketHash = await redis.get(`user:${userAId}:socket`);
  const userBSocketHash = await redis.get(`user:${userBId}:socket`);

  if (userASocketHash) {
    namespace.sockets.get(userASocketHash)?.leave(`user-status-${userBId}`);
  }
  if (userBSocketHash) {
    namespace.sockets.get(userBSocketHash)?.leave(`user-status-${userAId}`);
  }
}

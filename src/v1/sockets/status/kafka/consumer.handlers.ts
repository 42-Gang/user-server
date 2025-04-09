import { Namespace } from 'socket.io';
import { redis } from '../../../../plugins/redis.js';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { friendAddMessage, friendBlockMessage, userStatusMessage } from './messages.schema.js';
import { TypeOf } from 'zod';

export async function handleUserStatusMessage(
  message: TypeOf<typeof userStatusMessage>,
  namespace: Namespace,
) {
  const { userId, status } = message;

  console.log(`🔄 User ${userId} is now ${status}`);
  await redis.set(`user:${userId}:status`, status);
  namespace.to(`user-status-${userId}`).emit('friend-status', { friendId: userId, status });
}

export async function handleFriendAddMessage(
  message: TypeOf<typeof friendAddMessage>,
  namespace: Namespace,
  friendCacheRepository: FriendCacheInterface,
) {
  const { userAId, userBId } = message;
  await friendCacheRepository.addFriend(Number(userAId), { friendId: Number(userBId) });
  await friendCacheRepository.addFriend(Number(userBId), { friendId: Number(userAId) });

  await emitFriendStatus(namespace, userAId, userBId);
}

export async function handleFriendBlockMessage(
  message: TypeOf<typeof friendBlockMessage>,
  namespace: Namespace,
  friendCacheRepository: FriendCacheInterface,
) {
  const { userAId, userBId } = message;

  if (message.status === 'BLOCKED') {
    await redis.del(`user:${userAId}:friend:${userBId}`);
    await redis.del(`user:${userBId}:friend:${userAId}`);
  }

  if (message.status === 'UNBLOCKED') {
    await friendCacheRepository.addFriend(Number(userAId), { friendId: Number(userBId) });
    await friendCacheRepository.addFriend(Number(userBId), { friendId: Number(userAId) });
  }

  await emitFriendStatus(namespace, userAId, userBId);
}

async function emitFriendStatus(namespace: Namespace, userAId: string, userBId: string) {
  const userASocket = namespace.in(`user:${userAId}`);
  const userBSocket = namespace.in(`user:${userBId}`);

  userASocket?.socketsJoin(`user-status-${userBId}`);
  userBSocket?.socketsJoin(`user-status-${userAId}`);

  for (const id of [userAId, userBId]) {
    const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
    namespace.to(`user-status-${id}`).emit('friend-status', { friendId: id, status });
  }
}

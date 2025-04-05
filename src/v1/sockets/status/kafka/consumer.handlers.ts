import { Namespace } from 'socket.io';
import { redis } from '../../../../plugins/redis.js';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';

interface UserStatusMessage {
  userId: string;
  status: string;
}

interface FriendAddMessage {
  userId: string;
  friendId: string;
  timestamp: string;
}

export async function handleUserStatusMessage(message: UserStatusMessage, namespace: Namespace) {
  const { userId, status } = message;
  console.log(`🔄 User ${userId} is now ${status}`);
  await redis.set(`user:${userId}:status`, status);
  namespace.to(`user-status-${userId}`).emit('friend-status', { userId, status });
}

export async function handleFriendAddMessage(
  message: FriendAddMessage,
  namespace: Namespace,
  userSockets: Map<string, string>,
  friendCacheRepository: FriendCacheInterface,
) {
  const { userId, friendId } = message;
  await friendCacheRepository.addFriend(Number(userId), [{ id: Number(friendId) }]);
  await friendCacheRepository.addFriend(Number(friendId), [{ id: Number(userId) }]);

  const userSocketId = userSockets.get(userId);
  const friendSocketId = userSockets.get(friendId);

  userSocketId && namespace.sockets.get(userSocketId)?.join(`user-status-${friendId}`);
  friendSocketId && namespace.sockets.get(friendSocketId)?.join(`user-status-${userId}`);

  for (const id of [userId, friendId]) {
    const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
    namespace.to(`user-status-${id}`).emit('friend-status', { userId: id, status });
  }
}

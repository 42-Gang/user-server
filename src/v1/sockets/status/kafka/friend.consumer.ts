import { Namespace } from 'socket.io';
import { redis } from '../../../../plugins/redis.js';
import { TypeOf } from 'zod';
import { friendAddMessage, friendBlockMessage } from './messages.schema.js';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';

export default class FriendConsumer {
  constructor(
    private readonly namespace: Namespace,
    private readonly friendCacheRepository: FriendCacheInterface,
  ) {}

  async handleFriendAddMessage(message: TypeOf<typeof friendAddMessage>) {
    const { userAId, userBId } = message;
    await this.friendCacheRepository.addFriend(Number(userAId), { friendId: Number(userBId) });
    await this.friendCacheRepository.addFriend(Number(userBId), { friendId: Number(userAId) });

    await this.joinFriendStatusRooms(this.namespace, userAId, userBId);
    await this.emitFriendStatus(this.namespace, userAId, userBId);
  }

  async handleFriendBlockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { userAId, userBId } = message;

    if (message.status === 'BLOCKED') {
      await redis.del(`user:${userAId}:friend:${userBId}`);
      await redis.del(`user:${userBId}:friend:${userAId}`);
    }

    if (message.status === 'UNBLOCKED') {
      await this.friendCacheRepository.addFriend(Number(userAId), { friendId: Number(userBId) });
      await this.friendCacheRepository.addFriend(Number(userBId), { friendId: Number(userAId) });
    }

    await this.joinFriendStatusRooms(this.namespace, userAId, userBId);
    await this.emitFriendStatus(this.namespace, userAId, userBId);
  }

  private async emitFriendStatus(namespace: Namespace, userAId: string, userBId: string) {
    for (const id of [userAId, userBId]) {
      const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
      namespace.to(`user-status-${id}`).emit('friend-status', { friendId: id, status });
    }
  }

  private async joinFriendStatusRooms(namespace: Namespace, userAId: string, userBId: string) {
    const userASocket = namespace.in(`user:${userAId}`);
    const userBSocket = namespace.in(`user:${userBId}`);

    userASocket?.socketsJoin(`user-status-${userBId}`);
    userBSocket?.socketsJoin(`user-status-${userAId}`);
  }
}

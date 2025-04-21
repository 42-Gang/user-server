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
    const { fromUserId, toUserId } = message;

    await redis.del(`user:${fromUserId}:friend:${toUserId}`);
    await redis.del(`user:${toUserId}:friend:${fromUserId}`);

    await this.joinFriendStatusRooms(this.namespace, fromUserId, toUserId);
    await this.emitFriendStatus(this.namespace, fromUserId, toUserId);
  }

  async handleFriendUnblockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { fromUserId, toUserId } = message;

    await this.friendCacheRepository.addFriend(Number(fromUserId), {
      friendId: Number(toUserId),
    });
    await this.friendCacheRepository.addFriend(Number(toUserId), {
      friendId: Number(fromUserId),
    });

    await this.joinFriendStatusRooms(this.namespace, fromUserId, toUserId);
    await this.emitFriendStatus(this.namespace, fromUserId, toUserId);
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

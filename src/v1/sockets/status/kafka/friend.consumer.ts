import { Namespace } from 'socket.io';
import { redis } from '../../../../plugins/redis.js';
import { TypeOf } from 'zod';
import { friendAddMessage, friendBlockMessage } from './messages.schema.js';

export default class FriendConsumer {
  constructor(private readonly namespace: Namespace) {}

  async handleFriendAddMessage(message: TypeOf<typeof friendAddMessage>) {
    const { userAId, userBId } = message;

    console.log(message);
    await this.joinFriendStatusRooms(this.namespace, userAId.toString(), userBId.toString());
    await this.emitFriendStatus(this.namespace, userAId.toString(), userBId.toString());
  }

  async handleFriendBlockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.namespace.in(`user:${toUserId}`);
    toUserSocket?.socketsLeave(`user-status-${fromUserId}`);
  }

  async handleFriendUnblockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.namespace.in(`user:${toUserId}`);
    toUserSocket?.socketsJoin(`user-status-${fromUserId}`);
  }

  private async emitFriendStatus(namespace: Namespace, userAId: string, userBId: string) {
    for (const id of [userAId, userBId]) {
      const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
      await namespace.to(`user-status-${id}`).fetchSockets();
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

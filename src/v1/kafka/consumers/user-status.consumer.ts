import { Namespace } from 'socket.io';
import { TypeOf } from 'zod';
import { userStatusMessage } from '../schemas/messages.schema.js';
import { redis } from '../../../plugins/redis.js';

export default class UserStatusConsumer {
  constructor(private readonly namespace: Namespace) {}

  async handleUserStatusMessage(message: TypeOf<typeof userStatusMessage>) {
    const { userId, status } = message;

    await redis.set(`user:${userId}:status`, status);
    this.namespace.to(`user-status-${userId}`).emit('friend-status', { friendId: userId, status });
  }
}

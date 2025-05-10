import { Namespace } from 'socket.io';
import { TypeOf } from 'zod';
import { userStatusMessage } from '../schemas/messages.schema.js';
import { redis } from '../../../plugins/redis.js';
import { TOPICS, USER_STATUS_EVENTS } from '../constants.js';
import { KafkaTopicHandler } from './kafka.topic.handler.js';

export default class UserStatusTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.USER_STATUS;
  public readonly fromBeginning = false;

  constructor(private readonly statusNamespace: Namespace) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);

    if (parsedMessage.eventType == USER_STATUS_EVENTS.CHANGED) {
      const data = userStatusMessage.parse(parsedMessage);
      await this.handleUserStatusMessage(data);
    }
  }

  async handleUserStatusMessage(message: TypeOf<typeof userStatusMessage>) {
    const { userId, status, timestamp } = message;

    const current = await redis.get(`user:${userId}:status_timestamp`);
    if (current && new Date(current).getTime() > new Date(timestamp).getTime()) {
      return;
    }

    await redis.set(`user:${userId}:status`, status);
    await redis.set(`user:${userId}:status_timestamp`, timestamp);
    this.statusNamespace.to(`user-status-${userId}`).emit('friend-status', {
      friendId: userId,
      status,
    });
  }
}

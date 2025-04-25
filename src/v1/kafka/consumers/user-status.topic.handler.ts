import { Namespace } from 'socket.io';
import { TypeOf } from 'zod';
import { userStatusMessage } from '../schemas/messages.schema.js';
import { redis } from '../../../plugins/redis.js';
import { TOPICS, USER_STATUS_EVENTS } from '../constants.js';
import { KafkaTopicHandler } from './kafka.topic.handler.js';

export default class UserStatusTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.USER_STATUS;
  public readonly fromBeginning = true;

  constructor(private readonly statusNamespace: Namespace) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);
    const data = userStatusMessage.parse(parsedMessage);

    if (parsedMessage.eventType == USER_STATUS_EVENTS.CHANGED) {
      const data = userStatusMessage.parse(parsedMessage);
      await this.handleUserStatusMessage(data);
    }
    await this.handleUserStatusMessage(data);
  }

  async handleUserStatusMessage(message: TypeOf<typeof userStatusMessage>) {
    const { userId, status } = message;

    await redis.set(`user:${userId}:status`, status);
    this.statusNamespace.to(`user-status-${userId}`).emit('friend-status', {
      friendId: userId,
      status,
    });
  }
}

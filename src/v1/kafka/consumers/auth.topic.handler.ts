import { Namespace } from 'socket.io';
import { AUTH_EVENTS, TOPICS } from '../constants.js';
import { KafkaTopicHandler } from './kafka.topic.handler.js';
import { TypeOf } from 'zod';
import { authLogoutMessage } from '../schemas/messages.schema.js';

export default class AuthTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.AUTH;
  public readonly fromBeginning = false;

  constructor(
    private readonly statusNamespace: Namespace,
    private readonly friendNamespace: Namespace,
  ) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);

    if (parsedMessage.eventType == AUTH_EVENTS.LOGOUT) {
      await this.handleLogoutMessage(parsedMessage);
    }
  }

  async handleLogoutMessage(message: TypeOf<typeof authLogoutMessage>) {
    const { userId } = message;
    console.log(`🔴 [/auth] Logout: ${userId}`);

    await this.statusNamespace.to(`user:${userId}`).disconnectSockets();
    await this.friendNamespace.to(`user:${userId}`).disconnectSockets();
  }
}

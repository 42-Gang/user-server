import { Namespace } from 'socket.io';
import { redis } from '../../../plugins/redis.js';
import { TypeOf } from 'zod';
import { friendAddMessage, friendBlockMessage } from '../schemas/messages.schema.js';
import { KafkaTopicHandler } from './kafka.topic.handler.js';
import { FRIEND_EVENTS, TOPICS } from '../constants.js';
import { userStatus } from '../../sockets/status/status.schema.js';
import UserStatusTopicHandler from './user-status.topic.handler.js';

export default class FriendTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.FRIEND;
  public readonly fromBeginning = true;

  constructor(
    private readonly statusNamespace: Namespace,
    private readonly userStatusTopicHandler: UserStatusTopicHandler,
  ) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);

    if (parsedMessage.eventType == FRIEND_EVENTS.ADDED) {
      const data = friendAddMessage.parse(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: data.userAId,
        status: userStatus.ONLINE,
      });
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: data.userBId,
        status: userStatus.ONLINE,
      });

      await this.handleFriendAddMessage(data);
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.BLOCK) {
      const data = friendBlockMessage.parse(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: data.fromUserId,
        status: userStatus.ONLINE,
      });

      await this.handleFriendBlockMessage(parsedMessage);
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.UNBLOCK) {
      const data = friendBlockMessage.parse(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: data.fromUserId,
        status: userStatus.ONLINE,
      });

      await this.handleFriendUnblockMessage(parsedMessage);
    }
  }

  async handleFriendAddMessage(message: TypeOf<typeof friendAddMessage>) {
    const { userAId, userBId } = message;

    console.log(message);
    await this.joinFriendStatusRooms(this.statusNamespace, userAId.toString(), userBId.toString());
    await this.emitFriendStatus(this.statusNamespace, userAId.toString(), userBId.toString());
  }

  async handleFriendBlockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.statusNamespace.in(`user:${toUserId}`);
    toUserSocket?.socketsLeave(`user-status-${fromUserId}`);
  }

  async handleFriendUnblockMessage(message: TypeOf<typeof friendBlockMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.statusNamespace.in(`user:${toUserId}`);
    toUserSocket?.socketsJoin(`user-status-${fromUserId}`);
  }

  private async emitFriendStatus(namespace: Namespace, userAId: string, userBId: string) {
    await new Promise((r) => setTimeout(r, 50));

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

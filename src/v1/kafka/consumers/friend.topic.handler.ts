import { Namespace } from 'socket.io';
import { redis } from '../../../plugins/redis.js';
import { TypeOf } from 'zod';
import { friendAddMessage, friendMessage } from '../schemas/messages.schema.js';
import { KafkaTopicHandler } from './kafka.topic.handler.js';
import { FRIEND_EVENTS, TOPICS } from '../constants.js';
import { userStatus } from '../../sockets/status/status.schema.js';
import UserStatusTopicHandler from './user-status.topic.handler.js';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
import { NotFoundException } from '../../common/exceptions/core.error.js';

export default class FriendTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.FRIEND;
  public readonly fromBeginning = false;

  constructor(
    private readonly statusNamespace: Namespace,
    private readonly userStatusTopicHandler: UserStatusTopicHandler,
    private readonly friendNamespace: Namespace,
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);

    if (parsedMessage.eventType == FRIEND_EVENTS.ADDED) {
      const data = friendAddMessage.parse(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: Number(data.userAId),
        status: userStatus.ONLINE,
        timestamp: new Date().toISOString(),
      });

      await this.handleFriendAddMessage(data);
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.BLOCK) {
      const data = friendMessage.parse(parsedMessage);

      await this.handleFriendBlockMessage(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: Number(data.fromUserId),
        status: userStatus.ONLINE,
        timestamp: new Date().toISOString(),
      });
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.UNBLOCK) {
      const data = friendMessage.parse(parsedMessage);

      await this.handleFriendUnblockMessage(parsedMessage);
      await this.userStatusTopicHandler.handleUserStatusMessage({
        userId: Number(data.fromUserId),
        status: userStatus.ONLINE,
        timestamp: new Date().toISOString(),
      });
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.REQUESTED) {
      friendMessage.parse(parsedMessage);

      await this.handleFriendRequestMessage(this.userRepository, parsedMessage);
    }
    if (parsedMessage.eventType == FRIEND_EVENTS.ACCEPTED) {
      friendMessage.parse(parsedMessage);

      await this.handleFriendAcceptedMessage(this.userRepository, parsedMessage);
    }
  }

  async handleFriendAddMessage(message: TypeOf<typeof friendAddMessage>) {
    const { userAId, userBId } = message;

    console.log(message);
    await this.joinFriendStatusRooms(this.statusNamespace, userAId.toString(), userBId.toString());
    await this.emitFriendStatus(this.statusNamespace, userAId, userBId);
  }

  async handleFriendBlockMessage(message: TypeOf<typeof friendMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.statusNamespace.in(`user:${toUserId}`);
    toUserSocket?.socketsLeave(`user-status-${fromUserId}`);
  }

  async handleFriendUnblockMessage(message: TypeOf<typeof friendMessage>) {
    const { fromUserId, toUserId } = message;

    const toUserSocket = this.statusNamespace.in(`user:${toUserId}`);
    toUserSocket?.socketsJoin(`user-status-${fromUserId}`);
  }

  async handleFriendRequestMessage(
    userRepository: UserRepositoryInterface,
    message: TypeOf<typeof friendMessage>,
  ) {
    const { fromUserId, toUserId, timestamp } = message;

    const toUserSocket = this.friendNamespace.in(`user:${toUserId}`);

    console.log('friend-request emit!', fromUserId, toUserId);

    const fromUser = await userRepository.findById(fromUserId);
    if (!fromUser) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    toUserSocket?.emit('friend-request', {
      fromUserId: fromUserId,
      fromUserNickname: fromUser.nickname,
      toUserId: toUserId,
      timestamp: timestamp,
    });
  }

  async handleFriendAcceptedMessage(
    userRepository: UserRepositoryInterface,
    message: TypeOf<typeof friendMessage>,
  ) {
    const { fromUserId, toUserId, timestamp } = message;

    const fromUserSocket = this.friendNamespace.in(`user:${fromUserId}`);
    if (!fromUserSocket) {
      console.error('소켓이 존재하지 않습니다.', fromUserId);
      return;
    }
    console.log('friend-accept emit!', fromUserId, toUserId);

    const toUser = await userRepository.findById(toUserId);
    if (!toUser) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    fromUserSocket?.emit('friend-accept', {
      fromUserId: fromUserId,
      toUserNickname: toUser.nickname,
      toUserId: toUserId,
      timestamp: timestamp,
    });
  }

  private async emitFriendStatus(namespace: Namespace, userAId: number, userBId: number) {
    await new Promise((r) => setTimeout(r, 50));

    for (const id of [userAId, userBId]) {
      const status = (await redis.get(`user:${id}:status`)) || 'OFFLINE';
      namespace.to(`user-status-${id}`).emit('friend-status', {
        friendId: id,
        status,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async joinFriendStatusRooms(namespace: Namespace, userAId: string, userBId: string) {
    const userASocket = namespace.in(`user:${userAId}`);
    const userBSocket = namespace.in(`user:${userBId}`);

    userASocket?.socketsJoin(`user-status-${userBId}`);
    userBSocket?.socketsJoin(`user-status-${userAId}`);
  }
}

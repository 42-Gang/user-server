import { Namespace } from 'socket.io';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { TOPICS, GROUP_IDS, USER_STATUS_EVENTS, FRIEND_EVENTS } from './constants.js';
import { kafka } from '../../../../plugins/kafka.js';
import FriendConsumer from './friend.consumer.js';
import UserStatusConsumer from './user-status.consumer.js';
import { userStatus } from '../status.schema.js';
import { friendAddMessage, friendBlockMessage, userStatusMessage } from './messages.schema.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS.STATUS, sessionTimeout: 10000 });

async function handleFriendTopic(
  messageValue: string,
  friendConsumer: FriendConsumer,
  userStatusConsumer: UserStatusConsumer,
) {
  const parsedMessage = JSON.parse(messageValue);

  if (parsedMessage.eventType == FRIEND_EVENTS.ADDED) {
    const data = friendAddMessage.parse(parsedMessage);
    await userStatusConsumer.handleUserStatusMessage({
      userId: data.userAId,
      status: userStatus.ONLINE,
    });
    await userStatusConsumer.handleUserStatusMessage({
      userId: data.userBId,
      status: userStatus.ONLINE,
    });

    await friendConsumer.handleFriendAddMessage(data);
  }
  if (parsedMessage.eventType == FRIEND_EVENTS.BLOCK) {
    const data = friendBlockMessage.parse(parsedMessage);
    await userStatusConsumer.handleUserStatusMessage({
      userId: data.fromUserId,
      status: userStatus.ONLINE,
    });

    await friendConsumer.handleFriendBlockMessage(parsedMessage);
  }
  if (parsedMessage.eventType == FRIEND_EVENTS.UNBLOCK) {
    const data = friendBlockMessage.parse(parsedMessage);
    await userStatusConsumer.handleUserStatusMessage({
      userId: data.fromUserId,
      status: userStatus.ONLINE,
    });

    await friendConsumer.handleFriendUnblockMessage(parsedMessage);
  }
}

async function handleUserStatusTopic(messageValue: string, userStatusConsumer: UserStatusConsumer) {
  const parsedMessage = JSON.parse(messageValue);
  if (parsedMessage.eventType == USER_STATUS_EVENTS.CHANGED) {
    const data = userStatusMessage.parse(parsedMessage);
    await userStatusConsumer.handleUserStatusMessage(data);
  }
  return;
}

export async function startConsumer(
  namespace: Namespace,
  friendCacheRepository: FriendCacheInterface,
) {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.USER_STATUS, fromBeginning: true });
  await consumer.subscribe({ topic: TOPICS.FRIEND, fromBeginning: true });
  const friendConsumer = new FriendConsumer(namespace, friendCacheRepository);
  const userStatusConsumer = new UserStatusConsumer(namespace);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      if (topic === TOPICS.USER_STATUS) {
        await handleUserStatusTopic(message.value.toString(), userStatusConsumer);
      }
      if (topic === TOPICS.FRIEND) {
        await handleFriendTopic(message.value.toString(), friendConsumer, userStatusConsumer);
      }
    },
  });
}

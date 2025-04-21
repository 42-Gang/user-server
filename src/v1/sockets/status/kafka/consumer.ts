import { Namespace } from 'socket.io';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { TOPICS, GROUP_IDS, USER_STATUS_EVENTS, FRIEND_EVENTS } from './constants.js';
import { kafka } from '../../../../plugins/kafka.js';
import FriendConsumer from './friend.consumer.js';
import UserStatusConsumer from './user-status.consumer.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS.STATUS, sessionTimeout: 10000 });

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

      const parsedMessage = JSON.parse(message.value.toString());

      if (topic === TOPICS.USER_STATUS) {
        if (parsedMessage.eventType == USER_STATUS_EVENTS.CHANGED)
          await userStatusConsumer.handleUserStatusMessage(parsedMessage);
        return;
      }
      if (topic === TOPICS.FRIEND) {
        if (parsedMessage.eventType == FRIEND_EVENTS.ADDED)
          await friendConsumer.handleFriendAddMessage(parsedMessage);
        // if (
        //   parsedMessage.eventType == FRIEND_EVENTS.BLOCK ||
        //   parsedMessage.eventType == FRIEND_EVENTS.UNBLOCK
        // )
        //   await friendConsumer.handleFriendBlockMessage(parsedMessage);
        return;
      }
    },
  });
}

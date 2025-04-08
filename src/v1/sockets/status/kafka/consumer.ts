import { Namespace, Socket } from 'socket.io';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { TOPICS, GROUP_IDS } from './constants.js';
import {
  handleUserStatusMessage,
  handleFriendAddMessage,
  handleFriendBlockMessage,
} from './consumer.handlers.js';
import { kafka } from '../../../../plugins/kafka.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS.STATUS, sessionTimeout: 10000 });

export async function startConsumer(
  namespace: Namespace,
  userSockets: Map<string, Socket>,
  friendCacheRepository: FriendCacheInterface,
) {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.USER_STATUS, fromBeginning: false });
  await consumer.subscribe({ topic: TOPICS.FRIEND_ADD, fromBeginning: false });
  await consumer.subscribe({ topic: TOPICS.FRIEND_BLOCK, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      const parsedMessage = JSON.parse(message.value.toString());

      if (topic === TOPICS.USER_STATUS) {
        await handleUserStatusMessage(parsedMessage, namespace);
        return;
      }
      if (topic === TOPICS.FRIEND_ADD) {
        await handleFriendAddMessage(parsedMessage, namespace, userSockets, friendCacheRepository);
        return;
      }
      if (topic === TOPICS.FRIEND_BLOCK) {
        await handleFriendBlockMessage(
          parsedMessage,
          namespace,
          userSockets,
          friendCacheRepository,
        );
        return;
      }
    },
  });
}

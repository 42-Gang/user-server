import { Namespace } from 'socket.io';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { TOPICS, GROUP_IDS } from './constants.js';
import { handleUserStatusMessage, handleFriendAddMessage } from './consumer.handlers.js';
import { kafka } from '../../../../plugins/kafka.js';

const consumer = kafka.consumer({ groupId: GROUP_IDS.STATUS, sessionTimeout: 10000 });

export async function startConsumer(
  namespace: Namespace,
  userSockets: Map<string, string>,
  friendCacheRepository: FriendCacheInterface,
) {
  console.log('Starting Kafka consumer...', new Date().toISOString());
  await consumer.connect();
  console.log('Kafka consumer connected', new Date().toISOString());

  console.log('Kafka consumer subscribing to USER_STATUS and FRIEND_ADD', new Date().toISOString());
  await consumer.subscribe({ topic: TOPICS.USER_STATUS, fromBeginning: false });

  console.log('Kafka consumer subscribing to FRIEND_ADD', new Date().toISOString());
  await consumer.subscribe({ topic: TOPICS.FRIEND_ADD, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      const parsed = JSON.parse(message.value.toString());

      if (topic === TOPICS.USER_STATUS) {
        await handleUserStatusMessage(parsed, namespace);
        return;
      }
      if (topic === TOPICS.FRIEND_ADD) {
        await handleFriendAddMessage(parsed, namespace, userSockets, friendCacheRepository);
        return;
      }
    },
  });
  console.log('Kafka consumer is running', new Date().toISOString());
}

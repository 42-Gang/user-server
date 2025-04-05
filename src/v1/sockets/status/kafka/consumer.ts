import { Kafka } from 'kafkajs';
import { Namespace } from 'socket.io';
import { FriendCacheInterface } from '../../../storage/cache/interfaces/friend.cache.interface.js';
import { TOPICS, GROUP_IDS } from './constants.js';
import { handleUserStatusMessage, handleFriendAddMessage } from './consumer.handlers.js';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: GROUP_IDS.STATUS });

export async function startConsumer(
  namespace: Namespace,
  userSockets: Map<string, string>,
  friendCacheRepository: FriendCacheInterface,
) {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.USER_STATUS, fromBeginning: false });
  await consumer.subscribe({ topic: TOPICS.FRIEND_ADD, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      const parsed = JSON.parse(message.value.toString());

      switch (topic) {
        case TOPICS.USER_STATUS:
          await handleUserStatusMessage(parsed, namespace);
          break;

        case TOPICS.FRIEND_ADD:
          await handleFriendAddMessage(parsed, namespace, userSockets, friendCacheRepository);
          break;

        default:
          console.warn(`Unknown topic: ${topic}`);
      }
    },
  });
}

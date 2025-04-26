import { kafka } from '../../plugins/kafka.js';
import { KafkaTopicHandler } from './consumers/kafka.topic.handler.js';
import FriendTopicHandler from './consumers/friend.topic.handler.js';
import UserStatusTopicHandler from './consumers/user-status.topic.handler.js';

export async function startConsumer(
  friendTopicHandler: FriendTopicHandler,
  userStatusTopicHandler: UserStatusTopicHandler,
) {
  const consumer = kafka.consumer({ groupId: 'STATUS', sessionTimeout: 10000 });
  const handlers: KafkaTopicHandler[] = [friendTopicHandler, userStatusTopicHandler];

  await consumer.connect();

  for (const handler of handlers) {
    await consumer.subscribe({ topic: handler.topic, fromBeginning: handler.fromBeginning });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return console.warn(`Null message received on topic ${topic}`);
      }

      const handler = handlers.find((h) => h.topic === topic);
      if (!handler) {
        return console.warn(`No handler found for topic ${topic}`);
      }

      try {
        await handler.handle(message.value.toString());
      } catch (error) {
        console.error(
          `❌ Error handling message from topic ${topic}:`,
          error,
          'Raw message:',
          message.value.toString(),
        );
      }
    },
  });
}

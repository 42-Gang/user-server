import { kafka } from '../../plugins/kafka.js';
import { KafkaTopicHandler } from './consumers/kafka.topic.handler.js';
import FriendTopicHandler from './consumers/friend.topic.handler.js';
import UserStatusTopicHandler from './consumers/user-status.topic.handler.js';
import ImageTopicHandler from './consumers/image.topic.handler.js';
import AuthTopicHandler from './consumers/auth.topic.handler.js';

export async function startConsumer(
  friendTopicHandler: FriendTopicHandler,
  userStatusTopicHandler: UserStatusTopicHandler,
  authTopicHandler: AuthTopicHandler,
  imageTopicHandler: ImageTopicHandler,
) {
  const consumer = kafka.consumer({ groupId: 'USER_SERVER', sessionTimeout: 10000 });
  const handlers: KafkaTopicHandler[] = [
    friendTopicHandler,
    userStatusTopicHandler,
    authTopicHandler,
    imageTopicHandler,
  ];

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

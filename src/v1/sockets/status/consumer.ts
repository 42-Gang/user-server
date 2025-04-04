// kafka/consumer.js
import { Kafka } from 'kafkajs';
import { redis } from '../../../plugins/redis.js';
import { Namespace } from 'socket.io';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'status-consumer-group' });

export async function startConsumer(namespace: Namespace) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-status-topic', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { userId, status } = JSON.parse(message.value.toString());
      console.log(`Received status update for user ${userId}: ${status}`);

      await redis.set(`user:${userId}:status`, status);

      namespace.to(`user-status-${userId}`).emit('friend-status', { userId: userId, status });
    },
  });
}

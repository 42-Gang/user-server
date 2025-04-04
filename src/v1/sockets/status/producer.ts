import { Kafka } from 'kafkajs';
import { userStatus } from './status.schema.js';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

const producer = kafka.producer();

export const sendStatus = async (userId: number, status: typeof userStatus) => {
  console.log(`Sending status update for user ${userId}: ${status}`);

  await producer.connect();
  await producer.send({
    topic: 'user-status-topic',
    messages: [{ value: JSON.stringify({ userId, status }) }],
  });
  await producer.disconnect();
};

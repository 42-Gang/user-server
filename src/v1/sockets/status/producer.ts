import { Kafka } from 'kafkajs';
import { userStatus } from './status.schema.js';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const disconnectProducer = async () => {
  await producer.disconnect();
};

export const sendStatus = async (userId: number, status: userStatus) => {
  console.log(`Sending status update for user ${userId}: ${status}`);

  await producer.send({
    topic: 'user-status-topic',
    messages: [{ value: JSON.stringify({ userId, status }) }],
  });
};

import { Kafka } from 'kafkajs';
import { userStatus } from './status.schema.js';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

export const startProducer = async () => {
  await producer.connect();
  console.log('Kafka producer connected');
};

export const stopProducer = async () => {
  await producer.disconnect();
  console.log('Kafka producer disconnected');
};

export const sendStatus = async (userId: number, status: userStatus) => {
  console.log(`Sending status update for user ${userId}: ${status}`);

  await producer.connect();
  await producer.send({
    topic: 'user-status-topic',
    messages: [{ value: JSON.stringify({ userId, status }) }],
  });
};

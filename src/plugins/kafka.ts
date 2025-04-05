import { Kafka } from 'kafkajs';

export const kafka = new Kafka({ brokers: ['localhost:9092'] });
export const producer = kafka.producer();

producer.connect();

import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:9092'], // Docker 환경에 맞게 수정
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();

  await producer.send({
    topic: 'friend-add-topic',
    messages: [
      {
        key: '1323235',
        value: JSON.stringify({
          userId: '1',
          friendId: '10',
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });

  console.log('Friend add event sent!');
  await producer.disconnect();
};

run().catch(console.error);

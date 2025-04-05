import { Kafka } from 'kafkajs';
import { redis } from '../../../plugins/redis.js';
import { Namespace } from 'socket.io';
import { userStatus } from './status.schema.js';
import { connectProducer, disconnectProducer } from './producer.js';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'status-consumer-group' });

kafka.producer({ allowAutoTopicCreation: true });

interface UserStatusMessage {
  userId: string;
  status: string;
}

interface FriendAddMessage {
  userId: string;
  friendId: string;
  timestamp: string;
}

async function handleUserStatusMessage(message: UserStatusMessage, namespace: Namespace) {
  console.log(`Received status update for user ${message.userId}: ${message.status}`);
  await redis.set(`user:${message.userId}:status`, message.status);
  namespace.to(`user-status-${message.userId}`).emit('friend-status', {
    userId: message.userId,
    status: message.status,
  });
}

async function handleFriendAddMessage(
  message: FriendAddMessage,
  namespace: Namespace,
  userSockets: Map<string, string>,
) {
  const { userId, friendId } = message;

  // 상태 저장
  await redis.sadd(`user:${userId}:friends`, friendId);
  await redis.sadd(`user:${friendId}:friends`, userId);

  // 상태 ONLINE 설정
  await redis.set(`user:${userId}:status`, userStatus.ONLINE);
  await redis.set(`user:${friendId}:status`, userStatus.ONLINE);

  // ✅ 1번 → user-status-2 룸에 join
  const userSocketId = userSockets.get(userId);
  const friendSocketId = userSockets.get(friendId);

  if (userSocketId) {
    const userSocket = namespace.sockets.get(userSocketId);
    userSocket?.join(`user-status-${friendId}`);
  }

  // ✅ 2번 → user-status-1 룸에 join
  if (friendSocketId) {
    const friendSocket = namespace.sockets.get(friendSocketId);
    friendSocket?.join(`user-status-${userId}`);
  }

  // 이벤트 전송
  namespace.to(`user-status-${friendId}`).emit('friend-status', {
    userId: friendId,
    status: userStatus.ONLINE,
  });

  namespace.to(`user-status-${userId}`).emit('friend-status', {
    userId: userId,
    status: userStatus.ONLINE,
  });
}

export async function startConsumer(namespace: Namespace, userSockets: Map<string, string>) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-status-topic', fromBeginning: false });
  await consumer.subscribe({ topic: 'friend-add-topic', fromBeginning: false });

  await connectProducer();

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (message.value) {
        const parsedMessage = JSON.parse(message.value.toString());
        console.log(`Received message from topic ${topic}:`, parsedMessage);

        if (topic === 'user-status-topic') {
          await handleUserStatusMessage(parsedMessage as UserStatusMessage, namespace);
        } else if (topic === 'friend-add-topic') {
          await handleFriendAddMessage(parsedMessage as FriendAddMessage, namespace, userSockets);
        }
      } else {
        console.warn(`Received message with null value from topic ${topic}`);
      }
    },
  });

  await disconnectProducer();
}

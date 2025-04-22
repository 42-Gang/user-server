import { TOPICS, FRIEND_EVENTS } from '../../sockets/status/kafka/constants.js';
import { producer } from '../../../plugins/kafka.js';

export async function sendFriendRequestEvent({
  fromUserId,
  toUserId,
  timestamp = new Date().toISOString(),
}: {
  fromUserId: number;
  toUserId: number;
  timestamp?: string;
}) {
  await producer.send({
    topic: TOPICS.FRIEND,
    messages: [
      {
        key: String(Math.min(fromUserId, toUserId)) + '-' + String(Math.max(fromUserId, toUserId)),
        value: JSON.stringify({
          eventType: FRIEND_EVENTS.REQUESTED,
          fromUserId,
          toUserId,
          timestamp,
        }),
      },
    ],
  });
}

export async function sendFriendAcceptEvent({
  fromUserId,
  toUserId,
  timestamp = new Date().toISOString(),
}: {
  fromUserId: number;
  toUserId: number;
  timestamp?: string;
}) {
  await producer.send({
    topic: TOPICS.FRIEND,
    messages: [
      {
        key: String(Math.min(fromUserId, toUserId)) + '-' + String(Math.max(fromUserId, toUserId)),
        value: JSON.stringify({
          eventType: FRIEND_EVENTS.ACCEPTED,
          fromUserId,
          toUserId,
          timestamp,
        }),
      },
    ],
  });
}

export async function sendFriendAddedEvent({
  userAId,
  userBId,
  timestamp = new Date().toISOString(),
}: {
  userAId: number;
  userBId: number;
  timestamp?: string;
}) {
  await producer.send({
    topic: TOPICS.FRIEND,
    messages: [
      {
        key: String(Math.min(userAId, userBId)) + '-' + String(Math.max(userAId, userBId)),
        value: JSON.stringify({
          eventType: FRIEND_EVENTS.ADDED,
          userAId,
          userBId,
          timestamp,
        }),
      },
    ],
  });
}

export async function sendBlockEvent({
  fromUserId,
  toUserId,
  timestamp = new Date().toISOString(),
}: {
  fromUserId: number;
  toUserId: number;
  timestamp?: string;
}) {
  console.log('kafka producer 이벤트 발생');
  await producer.send({
    topic: TOPICS.FRIEND,
    messages: [
      {
        key: String(Math.min(fromUserId, toUserId)) + '-' + String(Math.max(fromUserId, toUserId)), // 동일한 차단 관계를 위한 키 생성
        value: JSON.stringify({
          eventType: FRIEND_EVENTS.BLOCK,
          fromUserId,
          toUserId,
          timestamp,
        }),
      },
    ],
  });
  console.log('kafka producer 이벤트 전송 완료');
}

export async function sendUnblockEvent({
  fromUserId,
  toUserId,
  timestamp = new Date().toISOString(),
}: {
  fromUserId: number;
  toUserId: number;
  timestamp?: string;
}) {
  await producer.send({
    topic: TOPICS.FRIEND,
    messages: [
      {
        key: String(Math.min(fromUserId, toUserId)) + '-' + String(Math.max(fromUserId, toUserId)), // 동일한 차단 관계를 위한 키 생성
        value: JSON.stringify({
          eventType: FRIEND_EVENTS.UNBLOCK,
          fromUserId,
          toUserId,
          timestamp,
        }),
      },
    ],
  });
}

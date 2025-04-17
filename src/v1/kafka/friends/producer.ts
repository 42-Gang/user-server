import { producer } from '../../../plugins/kafka.js';

export async function sendFriendAddEvent({
	userAId,
	userBId,
	timestamp = Date.now(),
  }: {
	userAId: number;
	userBId: number;
	timestamp?: number;
  }) {
	await producer.send({
	  topic: 'friend-add',
	  messages: [
		{
		  key: String(userAId),
		  value: JSON.stringify({ userAId, userBId, timestamp }),
		},
	  ],
	});
  }

 export async function sendFriendBlockEvent({
	userAId,
	userBId,
	status,
	timestamp = Date.now(),
  }: {
	userAId: number;
	userBId: number;
	status: 'BLOCKED' | 'UNBLOCKED';
	timestamp?: number;
  }) {
	await producer.send({
	  topic: 'friend-block',
	  messages: [
		{
		  key: String(userAId),
		  value: JSON.stringify({ userAId, userBId, status, timestamp }),
		},
	  ],
	});
  }

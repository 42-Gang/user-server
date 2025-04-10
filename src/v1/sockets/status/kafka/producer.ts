import { userStatus } from '../status.schema.js';
import { TOPICS } from './constants.js';
import { producer } from '../../../../plugins/kafka.js';

export async function sendStatus(userId: number, status: userStatus) {
  console.log(`Sending status update for user ${userId}: ${status}`);

  await producer.send({
    topic: TOPICS.USER_STATUS,
    messages: [{ value: JSON.stringify({ userId, status }) }],
  });
}

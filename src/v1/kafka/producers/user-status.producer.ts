import { userStatus } from '../../sockets/status/status.schema.js';
import { TOPICS, USER_STATUS_EVENTS } from '../constants.js';
import { producer } from '../../../plugins/kafka.js';

export async function sendStatus(userId: number, status: userStatus) {
  console.log(`Sending status update for user ${userId}: ${status}`);

  await producer.send({
    topic: TOPICS.USER_STATUS,
    messages: [
      {
        value: JSON.stringify({
          eventType: USER_STATUS_EVENTS.CHANGED,
          userId,
          status,
        }),
      },
    ],
  });
}

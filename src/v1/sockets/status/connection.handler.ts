import { Namespace, Socket } from 'socket.io';
import { redis } from '../../../plugins/redis.js';
import StatusService from './status.service.js';
import { userStatus } from './status.schema.js';
import { TypeOf } from 'zod';
import { friendsSchema } from './friends.schema.js';
import { sendStatus } from './kafka/producer.js';

export async function handleConnection(
  socket: Socket,
  namespace: Namespace,
  userSockets: Map<string, string>,
  statusService: StatusService,
) {
  try {
    const userId = socket.data.userId;
    console.log(`🟢 [/status] Connected: ${socket.id}, ${userId}`);

    userSockets.set(userId, socket.id);
    redis.set(`user:${userId}:status`, userStatus.ONLINE);

    const friends = await statusService.fetchFriends(userId);
    await joinFriendStatusRooms(socket, userId, friends);

    await sendStatus(userId, userStatus.ONLINE);

    socket.on('disconnect', async () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
      await sendStatus(userId, userStatus.OFFLINE);
      userSockets.delete(userId);
    });
  } catch (error) {
    console.error(`Error in connection handler: ${error}`);
  }
}

async function joinFriendStatusRooms(
  socket: Socket,
  userId: number,
  friends: TypeOf<typeof friendsSchema>,
) {
  for (const friend of friends) {
    const status = await redis.get(`user:${friend.id}:status`);
    socket.emit('friend-status', {
      userId: friend.id,
      status: status || 'OFFLINE',
    });
    socket.join(`user-status-${friend.id}`);
  }
}
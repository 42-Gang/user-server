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
  userSockets: Map<string, Socket>,
  statusService: StatusService,
) {
  try {
    const userId = socket.data.userId;
    console.log(`🟢 [/status] Connected: ${socket.id}, ${userId}`);

    userSockets.set(userId, socket);
    redis.set(`user:${userId}:status`, userStatus.ONLINE);

    const friends = await statusService.fetchFriends(userId);
    await joinFriendStatusRooms(socket, friends);
    await emitFriendsStatus(friends, socket);

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

async function joinFriendStatusRooms(socket: Socket, friends: TypeOf<typeof friendsSchema>) {
  for (const friend of friends) {
    socket.join(`user-status-${friend.friendId}`);
  }
}

async function emitFriendsStatus(friends: TypeOf<typeof friendsSchema>, socket: Socket) {
  for (const friend of friends) {
    const status = await redis.get(`user:${friend.friendId}:status`);
    socket.emit('friend-status', {
      friendId: friend.friendId,
      status: status || 'OFFLINE',
    });
  }
}

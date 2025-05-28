import { Namespace, Socket } from 'socket.io';
import { redis } from '../../../plugins/redis.js';
import StatusService from './status.service.js';
import { userStatus } from './status.schema.js';
import { TypeOf } from 'zod';
import { friendsSchema, friendType } from './friends.schema.js';
import { sendStatus } from '../../kafka/producers/user-status.producer.js';

export async function handleConnection(
  socket: Socket,
  namespace: Namespace,
  statusService: StatusService,
) {
  try {
    const userId = socket.data.userId;
    console.log(`🟢 [/status] Connected: ${socket.id}, ${userId}`);

    socket.join(`user:${userId}`);
    redis.set(`user:${userId}:status`, userStatus.ONLINE);

    const friends = await statusService.fetchFriends(userId);
    await joinFriendStatusRooms(socket, friends);
    await emitFriendsStatus(friends, socket);

    await sendStatus(userId, userStatus.ONLINE);

    socket.on('disconnect', async () => {
      console.log(`🔴 [/status] Disconnected: ${socket.id}`);
      await sendStatus(userId, userStatus.OFFLINE);
    });
  } catch (error) {
    console.error(`status 소켓 연결을 실패하였습니다. ${error}`);
  }
}

async function joinFriendStatusRooms(socket: Socket, friends: friendType) {
  for (const friend of friends) {
    if (friend.status === 'BLOCKED') continue;
    socket.join(`user-status-${friend.id}`);
  }
}

async function emitFriendsStatus(friends: TypeOf<typeof friendsSchema>, socket: Socket) {
  for (const friend of friends) {
    const status = await redis.get(`user:${friend.id}:status`);
    socket.emit('friend-status', {
      friendId: friend.id,
      status: status || 'OFFLINE',
    });
  }
}

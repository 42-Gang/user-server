import { FriendCacheInterface } from '../../storage/cache/interfaces/friend.cache.interface.js';
import { friendsSchema } from './friends.schema.js';
import { z } from 'zod';
import { gotClient } from '../../../plugins/http.client.js';
import * as console from 'node:console';

export default class StatusService {
  constructor(private readonly friendCacheRepository: FriendCacheInterface) {}

  async fetchFriends(userId: number): Promise<z.infer<typeof friendsSchema>> {
    const cachedFriends = await this.friendCacheRepository.getFriends(userId);
    if (cachedFriends?.length) return cachedFriends;

    // 나를 block 한 친구는 제외하고 가져오기 (추가)
    const response = await gotClient.request<{
      data: { friends: { id: number; friendId: number; nickname: string }[] };
    }>({
      method: 'GET',
      url: `http://localhost:8080/api/v1/friends/${userId}`,
      headers: {
        'X-Authenticated': 'true',
        'X-User-Id': userId.toString(),
      },
    });

    const friends = response.body.data.friends ?? [];
    console.log('friends', friends);

    friendsSchema.parse(friends);
    await this.friendCacheRepository.addFriends(userId, friends);
    return friends;
  }
}

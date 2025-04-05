import { FriendCacheInterface } from '../../storage/cache/interfaces/friend.cache.interface.js';
import { friendsSchema } from './friends.schema.js';
import { z } from 'zod';
import { gotClient } from '../../../plugins/http.client.js';

export default class StatusService {
  constructor(private readonly friendCacheRepository: FriendCacheInterface) {}

  // 나를 block 한 친구는 제외하고 가져오기
  async fetchFriends(userId: number): Promise<z.infer<typeof friendsSchema>> {
    const cachedFriends = await this.friendCacheRepository.getFriends(userId);
    if (cachedFriends && 0 < cachedFriends.length) {
      return cachedFriends;
    }

    const response = await gotClient.request<{
      data: { friends: { id: number; friend_id: number; nickname: string }[] };
    }>({
      method: 'GET',
      url: `http://localhost:8080/api/friends/v1/${userId}`,
      headers: {
        'X-Authenticated': 'true',
        'X-User-Id': userId.toString(),
      },
    });

    console.log('response', response.body);
    if (!response) {
      throw new Error('No friends found');
    }

    await this.friendCacheRepository.addFriend(userId, response.body.data.friends);
    return response.body.data.friends;
  }
}

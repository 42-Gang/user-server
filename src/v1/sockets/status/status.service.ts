import { FriendCacheInterface } from '../../storage/cache/interfaces/friend.cache.interface.js';
import { friendsSchema } from './friends.schema.js';
import { z } from 'zod';

export default class StatusService {
  constructor(private readonly friendCacheRepository: FriendCacheInterface) {}

  // 나를 block 한 친구는 제외하고 가져오기
  async fetchFriends(userId: number): Promise<z.infer<typeof friendsSchema>> {
    const cachedFriends = await this.friendCacheRepository.getFriends(userId);
    if (cachedFriends && 0 < cachedFriends.length) {
      return cachedFriends;
    }

    // const response = await gotClient.request<{
    //   data: { friends: { id: number }[] };
    // }>({
    //   method: 'GET',
    //   url: 'http://friends-server',
    //   headers: {
    //     'X-Authenticated': 'true',
    //     'X-User-Id': userId.toString(),
    //   },
    // });
    let response;
    console.log('userId', typeof userId);
    if (userId == 1) {
      response = {
        body: {
          data: {
            friends: [{ id: 2 }, { id: 3 }],
          },
        },
      };
    }
    if (userId == 2) {
      response = {
        body: {
          data: {
            friends: [{ id: 1 }, { id: 3 }],
          },
        },
      };
    }
    console.log('response', response);
    if (!response) {
      throw new Error('No friends found');
    }

    await this.friendCacheRepository.addFriend(userId, response.body.data.friends);
    return response.body.data.friends;
  }
}

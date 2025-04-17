import { FriendCacheInterface } from '../../storage/cache/interfaces/friend.cache.interface.js';
import { friendsSchema } from './friends.schema.js';
import { TypeOf } from 'zod';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';

export default class StatusService {
  constructor(
    private readonly friendCacheRepository: FriendCacheInterface,
    private readonly friendRepository: FriendRepositoryInterface,
  ) {}

  async fetchFriends(userId: number): Promise<TypeOf<typeof friendsSchema>> {
    // const cachedFriends = await this.friendCacheRepository.getFriends(userId);
    // if (cachedFriends?.length) return cachedFriends;

    const friends = await this.friendRepository.findAllByUserIdAndStatus(userId, 'ACCEPTED');

    friendsSchema.parse(friends);
    await this.friendCacheRepository.addFriends(userId, friends);
    return friends;
  }
}

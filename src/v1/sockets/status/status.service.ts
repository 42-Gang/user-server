import { friendsSchema, statusSchema } from './friends.schema.js';
import { TypeOf } from 'zod';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { NotFoundException } from '../../common/exceptions/core.error.js';

export default class StatusService {
  constructor(
    // private readonly friendCacheRepository: FriendCacheInterface,
    private readonly friendRepository: FriendRepositoryInterface,
  ) {}

  async fetchFriends(userId: number): Promise<TypeOf<typeof friendsSchema>> {
    // const cachedFriends = await this.friendCacheRepository.getFriends(userId);
    // if (cachedFriends?.length) return cachedFriends;

    const friends = await this.friendRepository.findAllByUserIdAndStatus(userId, 'ACCEPTED');

    friendsSchema.parse(friends);
    // await this.friendCacheRepository.addFriends(userId, friends);
    return friends;
  }

  async fetchFriendStatus({
    userId,
    friendId,
  }: {
    userId: number;
    friendId: number;
  }): Promise<TypeOf<typeof statusSchema>> {
    const foundFriend = await this.friendRepository.findByUserIdAndFriendId({
      userId,
      friendId,
    });
    if (!foundFriend) {
      throw new NotFoundException('Friend not found');
    }

    return {
      status: foundFriend.status,
    };
  }
}

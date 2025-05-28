import { statusSchema } from './friends.schema.js';
import { TypeOf } from 'zod';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { NotFoundException } from '../../common/exceptions/core.error.js';

export default class StatusService {
  constructor(
    // private readonly friendCacheRepository: FriendCacheInterface,
    private readonly friendRepository: FriendRepositoryInterface,
  ) {}

  async fetchFriends(userId: number) {
    return await this.friendRepository.findAllByUserIdAndNotBlocked(userId);
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
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    return {
      status: foundFriend.status,
    };
  }
}

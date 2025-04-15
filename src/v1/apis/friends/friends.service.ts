import { TypeOf } from 'zod';

import { STATUS } from '../../common/constants/status.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../../common/exceptions/core.error.js';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { friendResponseSchema } from './friends.schema.js';
import { Status, Friend } from '@prisma/client';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';

export default class FriendsService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly friendRepository: FriendRepositoryInterface
  ) {}

  async request(
    userId: number | undefined,
    friendId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friendUser = await this.userRepository.findById(friendId);
    if (!friendUser) {
      throw new NotFoundException('User not found');
    }
    if (userId == friendId) {
      throw new BadRequestException('');
    }
    const request = await this.friendRepository.findByUserIdAndFriendId(userId, friendId);
    if (request) {
      throw new ConflictException('Friend Request already exists');
    }

    await this.friendRepository.create({
      userId,
      friendId,
      status: Status.PENDING,
    });

    return {
      status: STATUS.SUCCESS,
      message: 'Request processed successfully',
    };
  }

  private async syncReverseFriendRelation(friend: Friend): Promise<void> {
    const reverseFriend = await this.friendRepository.findByUserIdAndFriendId(
      friend.friendId,
      friend.userId,
    );

    if (reverseFriend) {
      await this.friendRepository.update(reverseFriend.id, { status: Status.ACCEPTED });
      return;
    }

    await this.friendRepository.create({
      userId: friend.friendId,
      friendId: friend.userId,
      status: Status.ACCEPTED,
    });
  }

  async accept(
    userId: number | undefined,
    sender: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friend = await this.friendRepository.findByUserIdAndFriendId(sender, userId);
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be accepted');
    }

    await this.friendRepository.update(friend.id, {
      status: Status.ACCEPTED,
    });

    await this.syncReverseFriendRelation(friend);

    return {
      status: STATUS.SUCCESS,
      message: 'Friend request accepted successfully',
    };
  }

  async reject(
    userId: number | undefined,
    sender: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friend = await this.friendRepository.findByUserIdAndFriendId(sender, userId);
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    await this.friendRepository.update(friend.id, {
      status: Status.REJECTED,
    });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend request rejected successfully',
    };
  }

  async block(
    userId: number | undefined,
    friendId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friend = await this.friendRepository.findByUserIdAndFriendId(userId, friendId);
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.ACCEPTED) {
      throw new ConflictException('Only accepted friends can be blocked');
    }

    await this.friendRepository.update(friend.id, { status: Status.BLOCKED });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend has been blocked successfully',
    };
  }

  async unblock(
    userId: number | undefined,
    friendId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friend = await this.friendRepository.findByUserIdAndFriendId(userId, friendId);
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.BLOCKED) {
      throw new ConflictException('Only blocked friends can be unblocked');
    }

    await this.friendRepository.update(friend.id, { status: Status.ACCEPTED });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend has been unblocked successfully',
    };
  }

  // async getFriends(userId: number | undefined): Promise<TypeOf<typeof friendListResponseSchema>> {
  //   if (!userId) {
  //     throw new NotFoundException('User not found');
  //   }
  // const friends = await this.friendRepository.findByUserIdAndStatus(userId, Status.ACCEPTED);
  // const friendIds = friends.map((f) => f.friendId);
  // const friendProfiles = await this.userService.findManyByIds(friendIds);

  // return {
  //   status: STATUS.SUCCESS,
  //   message: 'Friend list retrieved successfully',
  //   data: friendProfiles,
  // };
  // }

  // async listRequests()

  //Friend List의 돋보기 필드->인풋 검증 스키마 필요 string
  //ADD Friendvlfem->->인풋 검증 스키마 필요 string
}

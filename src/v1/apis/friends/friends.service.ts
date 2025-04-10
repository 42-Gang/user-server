import { TypeOf } from 'zod';

import { STATUS } from '../../common/constants/status.js';
import {
  NotFoundException,
  UnAuthorizedException,
  ConflictException,
} from '../../common/exceptions/core.error.js';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { friendResponseSchema } from './friends.schema.js';
import { Status } from '@prisma/client';

export default class FriendsService {
  constructor(private readonly friendRepository: FriendRepositoryInterface) {}

  async request(
    userId: number | undefined,
    friendId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const Request = await this.friendRepository.findByUserIdAndFriendId(userId, friendId);
    console.log('🔹 Request Id:', Request?.id);
    if (Request) {
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

  async accept(
    userId: number | undefined,
    id: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friendEntry = await this.friendRepository.findById(id);
    if (!friendEntry) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendEntry.friendId !== userId) {
      throw new UnAuthorizedException('You are not authorized to perform this action');
    }
    if (friendEntry.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be accepted');
    }

    const updatedFriendEntry = await this.friendRepository.update(id, {
      status: Status.ACCEPTED,
    });

    const reverseEntry = await this.friendRepository.findByUserIdAndFriendId(
      updatedFriendEntry.friendId,
      updatedFriendEntry.userId,
    );

    if (reverseEntry) {
      if (reverseEntry.status !== Status.PENDING) {
        throw new ConflictException('Only pending requests can be accepted');
      }
      await this.friendRepository.update(reverseEntry.id, { status: Status.ACCEPTED });
    } else if (!reverseEntry) {
      await this.friendRepository.create({
        userId: updatedFriendEntry.friendId,
        friendId: updatedFriendEntry.userId,
        status: Status.ACCEPTED,
      });
    }

    return {
      status: STATUS.SUCCESS,
      message: 'Friend request accepted successfully',
    };
  }

  async reject(
    userId: number | undefined,
    id: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friendEntry = await this.friendRepository.findById(id);
    if (!friendEntry) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendEntry.friendId !== userId) {
      throw new UnAuthorizedException('You are not authorized to perform this action');
    }
    if (friendEntry.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    await this.friendRepository.update(id, {
      status: Status.REJECTED,
    });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend request rejected successfully',
    };
  }

  async block(
    userId: number | undefined,
    id: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friendEntry = await this.friendRepository.findById(id);
    if (!friendEntry) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendEntry.userId !== userId) {
      throw new UnAuthorizedException('You are not authorized to perform this action');
    }
    if (friendEntry.status !== Status.ACCEPTED) {
      throw new ConflictException('Only accepted friends can be blocked');
    }

    await this.friendRepository.update(id, { status: Status.BLOCKED });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend has been blocked successfully',
    };
  }

  async unblock(
    userId: number | undefined,
    id: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friendEntry = await this.friendRepository.findById(id);
    if (!friendEntry) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendEntry.userId !== userId) {
      throw new UnAuthorizedException('You are not authorized to perform this action');
    }
    if (friendEntry.status !== Status.BLOCKED) {
      throw new ConflictException('Only blocked friends can be unblocked');
    }

    await this.friendRepository.update(id, { status: Status.ACCEPTED });

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

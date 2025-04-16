import { TypeOf } from 'zod';

import { STATUS } from '../../common/constants/status.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../../common/exceptions/core.error.js';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { friendResponseSchema, friendListResponseSchema } from './friends.schema.js';
import { Status, Friend } from '@prisma/client';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';

export default class FriendsService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly friendRepository: FriendRepositoryInterface,
  ) {}

  async request(
    userId: number | undefined,
    friendId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
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

  async getFriends(userId: number | undefined): Promise<TypeOf<typeof friendListResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const acceptedFriends = await this.friendRepository.findAllByUserIdAndStatus(
      userId,
      Status.ACCEPTED,
    );
    const blockedFriends = await this.friendRepository.findAllByUserIdAndStatus(
      userId,
      Status.BLOCKED,
    );

    const allFriends = [
      ...acceptedFriends.map((friend) => ({ friendId: friend.friendId, status: Status.ACCEPTED })),
      ...blockedFriends.map((friend) => ({ friendId: friend.friendId, status: Status.BLOCKED })),
    ];

    //친구 데이터 배열로 정리
    //각 친구 ID에 대해 findById를 사용하여 nickname과 avatar 정보 가져오기
    const friendsData = await Promise.all(
      allFriends.map(async ({ friendId, status }) => {
        const profile = await this.userRepository.findById(friendId);
        if (!profile) {
          throw new NotFoundException(`유저 ID ${friendId}를 찾을 수 없습니다`);
        }
        return {
          friend_id: friendId,
          nickname: profile.nickname,
          avatar: profile.avatarUrl,
          status: status,
        };
      }),
    );

    return {
      status: STATUS.SUCCESS,
      message: 'Friend list retrieved successfully',
      data: {
        friends: friendsData,
      },
    };
  }

  // async listRequests()

  //Friend List의 돋보기 필드->인풋 검증 스키마 필요 string
  //ADD Friendvlfem->->인풋 검증 스키마 필요 string
}

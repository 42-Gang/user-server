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
import { sendFriendAddEvent, sendFriendBlockEvent } from '../../kafka/friends/producer.js';

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
      throw new NotFoundException('Sender user not found');
    }
    const recipient = await this.userRepository.findById(friendId);
    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }
    if (userId == friendId) {
      throw new BadRequestException('');
    }
    const request = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (request) {
      throw new ConflictException('Friend Request already exists');
    }

    await this.friendRepository.create({
      userId,
      friendId,
      status: Status.PENDING,
    });

    // 웹소켓으로 요청 발생했다는 이벤트 전송

    return {
      status: STATUS.SUCCESS,
      message: 'Request processed successfully',
    };
  }

  async accept(
    userId: number | undefined,
    senderId: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    // 상대방이 나에게 보낸 요청
    const friendRequest = await this.friendRepository.findByUserIdAndFriendId({
      userId: senderId,
      friendId: userId,
    });
    if (!friendRequest) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (friendRequest.status !== Status.PENDING) {
      throw new ConflictException('대기 요청이 아닙니다.');
    }

    // 상대방의 요청 수락
    await this.friendRepository.update(friendRequest.id, {
      status: Status.ACCEPTED,
    });

    // 나와 상대방의 친구 관계를 동기화
    await this.syncReverseFriendRelation(friendRequest);

    // 웹소켓으로 요청 수락했다는 이벤트 전송
    await sendFriendAddEvent({ userAId: userId, userBId: senderId });
    await sendFriendAddEvent({ userAId: senderId, userBId: userId });

    return {
      status: STATUS.SUCCESS,
      message: '친구 요청을 수락했습니다.',
    };
  }

  async reject(
    userId: number | undefined,
    sender: number,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const friend = await this.friendRepository.findByUserIdAndFriendId({
      userId: sender,
      friendId: userId,
    });
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    await this.friendRepository.update(friend.id, {
      status: Status.REJECTED,
    });

    // 웹소켓으로 요청 거절했다는 이벤트 전송

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
    const friend = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.ACCEPTED) {
      throw new ConflictException('Only accepted friends can be blocked');
    }

    await this.friendRepository.update(friend.id, { status: Status.BLOCKED });

    await sendFriendBlockEvent({ userAId: userId, userBId: friendId, status: 'BLOCKED' });

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
    const friend = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.BLOCKED) {
      throw new ConflictException('Only blocked friends can be unblocked');
    }

    await this.friendRepository.update(friend.id, { status: Status.ACCEPTED });

    await sendFriendBlockEvent({ userAId: userId, userBId: friendId, status: 'UNBLOCKED' });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend has been unblocked successfully',
    };
  }

  private async syncReverseFriendRelation(friendRequest: Friend): Promise<void> {
    // 나와 상대방의 친구 관계
    const reverseFriend = await this.friendRepository.findByUserIdAndFriendId({
      userId: friendRequest.friendId,
      friendId: friendRequest.userId,
    });

    // 이미 존재하면 상태 업데이트
    if (reverseFriend) {
      await this.friendRepository.update(reverseFriend.id, { status: Status.ACCEPTED });
      return;
    }

    // 존재하지 않으면 생성 (수락 상태)
    await this.friendRepository.create({
      userId: friendRequest.friendId,
      friendId: friendRequest.userId,
      status: Status.ACCEPTED,
    });
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

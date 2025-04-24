import { TypeOf } from 'zod';

import { STATUS } from '../../common/constants/status.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnAuthorizedException,
} from '../../common/exceptions/core.error.js';
import FriendRepositoryInterface from '../../storage/database/interfaces/friend.repository.interface.js';
import { friendResponseSchema } from './friends.schema.js';
import { friendListResponseSchema } from './schemas/get-friends.schema.js';
import { getRequestsResponseSchema } from './schemas/get-requests.schema.js';
import { getStatusQuerySchema } from './schemas/get-status.schema.js';
import { Status, Friend } from '@prisma/client';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';

export default class FriendsService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly friendRepository: FriendRepositoryInterface,
  ) {}

  async request(userId: number, friendId: number): Promise<TypeOf<typeof friendResponseSchema>> {
    const recipient = await this.userRepository.findById(friendId);
    if (!recipient) {
      throw new NotFoundException('친구 요청을 받는 사용자가 존재하지 않습니다.');
    }
    if (userId == friendId) {
      throw new BadRequestException('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
    }
    const request = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (request) {
      throw new ConflictException('이미 친구 요청 내역이 존재합니다.');
    }

    await this.friendRepository.create({
      user: { connect: { id: userId } },
      friend: { connect: { id: friendId } },
      status: Status.PENDING,
    });

    return {
      status: STATUS.SUCCESS,
      message: '친구 요청을 보냈습니다.',
    };
  }

  async accept(userId: number, senderId: number): Promise<TypeOf<typeof friendResponseSchema>> {
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

    return {
      status: STATUS.SUCCESS,
      message: '친구 요청을 수락했습니다.',
    };
  }

  async reject(userId: number, sender: number): Promise<TypeOf<typeof friendResponseSchema>> {
    const friendRequest = await this.friendRepository.findByUserIdAndFriendId({
      userId: sender,
      friendId: userId,
    });
    if (!friendRequest) {
      throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    }
    if (friendRequest.status !== Status.PENDING) {
      throw new ConflictException('대기 요청이 아닙니다.');
    }

    await this.friendRepository.update(friendRequest.id, {
      status: Status.REJECTED,
    });

    return {
      status: STATUS.SUCCESS,
      message: '친구 요청을 거절했습니다.',
    };
  }

  async block(userId: number, friendId: number): Promise<TypeOf<typeof friendResponseSchema>> {
    const friend = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (!friend) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }
    if (friend.status !== Status.ACCEPTED) {
      throw new ConflictException('친구만 차단할 수 있습니다.');
    }

    await this.friendRepository.update(friend.id, { status: Status.BLOCKED });

    return {
      status: STATUS.SUCCESS,
      message: '친구를 차단했습니다.',
    };
  }

  async unblock(userId: number, friendId: number): Promise<TypeOf<typeof friendResponseSchema>> {
    const friend = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (!friend) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }
    if (friend.status !== Status.BLOCKED) {
      throw new ConflictException('차단된 친구만 차단을 해제할 수 있습니다.');
    }

    await this.friendRepository.update(friend.id, { status: Status.ACCEPTED });

    return {
      status: STATUS.SUCCESS,
      message: '친구를 차단 해제했습니다.',
    };
  }

  async getFriends(
    userId: number,
    statuses: Status[],
  ): Promise<TypeOf<typeof friendListResponseSchema>> {
    const fetchResults = await this.friendRepository.findAllByUserIdAndStatuses(userId, statuses);

    const friends = fetchResults.map((result) => ({
      friendId: result.friendId,
      nickname: result.friend.nickname,
      avatarUrl: result.friend.avatarUrl,
      status: result.status,
    }));

    return {
      status: STATUS.SUCCESS,
      message: '친구 목록이 성공적으로 조회되었습니다.',
      data: {
        friends,
      },
    };
  }

  async getRequests(userId: number): Promise<TypeOf<typeof getRequestsResponseSchema>> {
    const allRequests = await this.friendRepository.findAllByFriendIdAndStatus({
      friendId: userId,
      status: Status.PENDING,
    });

    const requests = allRequests.map((request) => ({
      friendId: request.userId,
      nickname: request.user.nickname,
      avatarUrl: request.user.avatarUrl,
    }));

    return {
      status: STATUS.SUCCESS,
      message: '친구 요청 목록이 성공적으로 조회되었습니다.',
      data: {
        requests,
      },
    };
  }

  //다음 커밋 때 internal로 수정하면 좋을 듯 합니다
  async getStatus(
    userId: number,
    parsed: TypeOf<typeof getStatusQuerySchema>,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (userId !== parsed.userId) {
      throw new UnAuthorizedException('이 작업을 수행할 권한이 없습니다');
    }

    const friend = await this.friendRepository.findByUserIdAndFriendId({
      userId,
      friendId: parsed.friendId,
    });
    if (!friend) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      message: '친구 관계가 성공적으로 조회되었습니다.',
      data: {
        status: friend.status,
      },
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
      user: { connect: { id: friendRequest.friendId } },
      friend: { connect: { id: friendRequest.userId } },
      status: Status.ACCEPTED,
    });
  }
}

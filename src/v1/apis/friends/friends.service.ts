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
import {
  sendFriendRequestEvent,
  sendFriendAcceptEvent,
  sendFriendAddedEvent,
  sendBlockEvent,
  sendUnblockEvent,
} from '../../kafka/friends/producer.js';

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
    await sendFriendRequestEvent({ fromUserId: userId, toUserId: friendId });

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

    // 웹소켓으로 요청 수락했다는 이벤트 전송(생기는 방이 하나이므로 한번만 전송)
    await sendFriendAcceptEvent({ fromUserId: senderId, toUserId: userId });
    await sendFriendAddedEvent({ userAId: userId, userBId: senderId });

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
    const friendRequest = await this.friendRepository.findByUserIdAndFriendId({
      userId: sender,
      friendId: userId,
    });
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }
    if (friendRequest.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be rejected');
    }

    await this.friendRepository.update(friendRequest.id, {
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
    const friend = await this.friendRepository.findByUserIdAndFriendId({ userId, friendId });
    if (!friend) {
      throw new NotFoundException('Friend request not found');
    }
    if (friend.status !== Status.ACCEPTED) {
      throw new ConflictException('Only accepted friends can be blocked');
    }

    await this.friendRepository.update(friend.id, { status: Status.BLOCKED });

    await sendBlockEvent({ fromUserId: userId, toUserId: friendId });

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

    await sendUnblockEvent({ fromUserId: userId, toUserId: friendId });

    return {
      status: STATUS.SUCCESS,
      message: 'Friend has been unblocked successfully',
    };
  }

  async getFriends(
    userId: number | undefined,
    statuses: Status[] | undefined,
  ): Promise<TypeOf<typeof friendListResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const targetStatuses =
      statuses && statuses.length > 0
        ? statuses
        : [Status.ACCEPTED, Status.BLOCKED, Status.REJECTED, Status.PENDING];

    const allFriends = (
      await Promise.all(
        targetStatuses.map((status) =>
          this.friendRepository.findAllByUserIdAndStatus(userId, status).then((friends) =>
            friends.map((f) => ({
              friendId: f.friendId,
              status,
            })),
          ),
        ),
      )
    ).flat();

    const friendsData = await Promise.all(
      allFriends.map(async ({ friendId, status }) => {
        const profile = await this.userRepository.findById(friendId);
        if (!profile) {
          throw new NotFoundException(`유저 ID ${friendId}를 찾을 수 없습니다`);
        }
        return {
          friendId: friendId,
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
          status,
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

  async getRequests(userId: number | undefined): Promise<TypeOf<typeof getRequestsResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const allRequests = await this.friendRepository.findAllByFriendIdAndStatus(
      userId,
      Status.PENDING,
    );

    const requestsData = await Promise.all(
      allRequests.map(async ({ userId }) => {
        const profile = await this.userRepository.findById(userId);
        if (!profile) {
          throw new NotFoundException(`유저 ID ${userId}를 찾을 수 없습니다`);
        }
        return {
          userId: userId,
          nickname: profile.nickname,
          avatarUrl: profile.avatarUrl,
        };
      }),
    );

    return {
      status: STATUS.SUCCESS,
      message: 'Friend requests retrieved successfully',
      data: {
        requests: requestsData,
      },
    };
  }

  //다음 커밋 때 internal로 수정하면 좋을 듯 합니다
  async getStatus(
    userId: number | undefined,
    parsed: TypeOf<typeof getStatusQuerySchema>,
  ): Promise<TypeOf<typeof friendResponseSchema>> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    if (userId !== parsed.user_id) {
      throw new UnAuthorizedException('이 작업을 수행할 권한이 없습니다');
    }

    const friend = await this.friendRepository.findByUserIdAndFriendId({
      userId,
      friendId: parsed.friend_id,
    });
    if (!friend) {
      throw new NotFoundException('친구 관계를 찾을 수 없습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      message: 'Friend status retrieved successfully',
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
      userId: friendRequest.friendId,
      friendId: friendRequest.userId,
      status: Status.ACCEPTED,
    });
  }
}

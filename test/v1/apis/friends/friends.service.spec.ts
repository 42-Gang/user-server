import { beforeEach, describe, expect, it, vi } from 'vitest';
import FriendsService from '../../../../src/v1/apis/friends/friends.service.js';
import { STATUS } from '../../../../src/v1/common/constants/status.js';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';
import { Status } from '@prisma/client';
import UserRepositoryInterface from '../../../../src/v1/storage/database/interfaces/user.repository.interface.js';
import FriendRepositoryInterface from '../../../../src/v1/storage/database/interfaces/friend.repository.interface.js';
import UserRepositoryPrisma from '../../../../src/v1/storage/database/prisma/user.repository.js';
import mockPrisma from '../../mocks/mockPrisma.js';
import FriendRepositoryPrisma from '../../../../src/v1/storage/database/prisma/friend.repository.js';

let userRepository: UserRepositoryInterface;
let friendRepository: FriendRepositoryInterface;
let friendsService: FriendsService;

beforeEach(() => {
  userRepository = new UserRepositoryPrisma(mockPrisma);
  friendRepository = new FriendRepositoryPrisma(mockPrisma);

  friendsService = new FriendsService(userRepository, friendRepository);
});

describe('친구 요청', () => {
  it('정상', async () => {
    userRepository.findById = vi.fn().mockResolvedValue({ id: 2 });
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);
    friendRepository.create = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.request(1, 2);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('친구 요청을 보냈습니다.');
  });

  it('자기 자신에게 요청 시도', async () => {
    userRepository.findById = vi.fn().mockResolvedValue({ id: 2 });
    await expect(friendsService.request(1, 1)).rejects.toThrow(BadRequestException);
  });

  it('상대 유저가 없음', async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);
    await expect(friendsService.request(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('이미 요청 존재', async () => {
    userRepository.findById = vi.fn().mockResolvedValue({ id: 2 });
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({ id: 123 });

    await expect(friendsService.request(1, 2)).rejects.toThrow(ConflictException);
  });
});

describe('친구 요청 수락', () => {
  it('정상', async () => {
    const request = { id: 1, userId: 2, friendId: 1, status: Status.PENDING };

    friendRepository.findByUserIdAndFriendId = vi
      .fn()
      .mockResolvedValueOnce(request)
      .mockResolvedValueOnce(null); // reverse 없음

    friendRepository.update = vi.fn().mockResolvedValue(undefined);
    friendRepository.create = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.accept(1, 2);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('친구 요청을 수락했습니다.');
  });

  it('요청이 존재하지 않음', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);
    await expect(friendsService.accept(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('대기 상태 아님', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      status: Status.ACCEPTED,
    });

    await expect(friendsService.accept(1, 2)).rejects.toThrow(ConflictException);
  });

  it('친구 요청 수락 시 reverse 관계가 존재하면 update만 수행', async () => {
    const request = { id: 1, userId: 2, friendId: 1, status: Status.PENDING };

    friendRepository.findByUserIdAndFriendId = vi
      .fn()
      .mockResolvedValueOnce(request) // 첫 번째: 요청 찾기
      .mockResolvedValueOnce({ id: 99, status: Status.PENDING }); // 두 번째: reverse 존재

    friendRepository.update = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.accept(1, 2);

    expect(friendRepository.update).toHaveBeenCalledWith(99, { status: Status.ACCEPTED });
    expect(result.status).toBe(STATUS.SUCCESS);
  });

  it('친구 수락 시 reverseFriend가 존재하면 update만 호출', async () => {
    const friendRequest = {
      id: 10,
      userId: 2,
      friendId: 1,
      status: Status.PENDING,
    };

    friendRepository.findByUserIdAndFriendId = vi
      .fn()
      .mockResolvedValueOnce(friendRequest) // 수락할 요청
      .mockResolvedValueOnce({ id: 99 }); // reverseFriend 존재

    friendRepository.update = vi.fn().mockResolvedValue(undefined);
    friendRepository.create = vi.fn(); // 호출되지 않아야 함

    const result = await friendsService.accept(1, 2);

    expect(friendRepository.update).toHaveBeenCalledWith(10, { status: Status.ACCEPTED });
    expect(friendRepository.update).toHaveBeenCalledWith(99, { status: Status.ACCEPTED });
    expect(friendRepository.create).not.toHaveBeenCalled();
    expect(result.status).toBe(STATUS.SUCCESS);
  });
});

describe('친구 요청 거절', () => {
  it('정상', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      id: 1,
      status: Status.PENDING,
    });
    friendRepository.update = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.reject(1, 2);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('친구 요청을 거절했습니다.');
  });

  it('요청 없음', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);
    await expect(friendsService.reject(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('대기 요청이 아님', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      status: Status.ACCEPTED,
    });

    await expect(friendsService.reject(1, 2)).rejects.toThrow(ConflictException);
  });
});

describe('친구 차단', () => {
  it('정상', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      id: 1,
      status: Status.ACCEPTED,
    });
    friendRepository.update = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.block(1, 2);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('친구를 차단했습니다.');
  });

  it('친구 아님', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      status: Status.PENDING,
    });

    await expect(friendsService.block(1, 2)).rejects.toThrow(ConflictException);
  });

  it('차단 실패 - 친구 관계가 없음', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);

    await expect(friendsService.block(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('차단 실패 - 친구가 아닌 상태(PENDING)', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      id: 1,
      status: Status.PENDING,
    });

    await expect(friendsService.block(1, 2)).rejects.toThrow(ConflictException);
  });
});

describe('차단 해제', () => {
  it('정상', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      id: 1,
      status: Status.BLOCKED,
    });
    friendRepository.update = vi.fn().mockResolvedValue(undefined);

    const result = await friendsService.unblock(1, 2);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('친구를 차단 해제했습니다.');
  });

  it('차단 상태가 아님', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      status: Status.ACCEPTED,
    });

    await expect(friendsService.unblock(1, 2)).rejects.toThrow(ConflictException);
  });

  it('차단 해제 실패 - 친구 관계 없음', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);

    await expect(friendsService.unblock(1, 2)).rejects.toThrow(NotFoundException);
  });
});

describe('친구 목록 조회', () => {
  it('정상', async () => {
    friendRepository.findAllByUserIdAndStatuses = vi.fn().mockResolvedValue([
      {
        friendId: 2,
        friend: {
          nickname: 'friend2',
          avatarUrl: 'url2',
        },
        status: Status.ACCEPTED,
      },
    ]);

    const result = await friendsService.getFriends(1, [Status.ACCEPTED]);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data!.friends.length).toBe(1);
    expect(result.data!.friends[0].nickname).toBe('friend2');
  });
});

describe('친구 요청 목록 조회', () => {
  it('정상', async () => {
    friendRepository.findAllByFriendIdAndStatus = vi.fn().mockResolvedValue([
      {
        userId: 2,
        user: {
          nickname: 'friend2',
          avatarUrl: 'url2',
        },
      },
    ]);

    const result = await friendsService.getRequests(1);
    expect(result.status).toBe(STATUS.SUCCESS);
    console.log(result.data?.requests)
    expect(result.data?.requests).toEqual([
      {
        userId: 2,
        nickname: 'friend2',
        avatarUrl: 'url2',
      },
    ]);
  });
});

describe('친구 상태 확인', () => {
  it('정상', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue({
      status: Status.ACCEPTED,
    });

    const result = await friendsService.getStatus(1, { userId: 1, friendId: 2 });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data!.status).toBe(Status.ACCEPTED);
  });

  it('권한 없음', async () => {
    await expect(friendsService.getStatus(1, { userId: 2, friendId: 1 })).rejects.toThrow(
      UnAuthorizedException,
    );
  });

  it('친구 관계 없음', async () => {
    friendRepository.findByUserIdAndFriendId = vi.fn().mockResolvedValue(null);

    await expect(friendsService.getStatus(1, { userId: 1, friendId: 2 })).rejects.toThrow(
      NotFoundException,
    );
  });
});

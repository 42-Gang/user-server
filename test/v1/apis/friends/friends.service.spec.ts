import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STATUS } from '../../../../src/v1/common/constants/status.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';
import { Status } from '@prisma/client';
import FriendRepositoryInterface from '../../../../src/v1/storage/database/interfaces/friend.repository.interface.js';
import UserRepositoryInterface from '../../../../src/v1/storage/database/interfaces/user.repository.interface.js';
import FriendsService from '../../../../src/v1/apis/friends/friends.service.js';

vi.mock('../../../../src/v1/kafka/friends/producer.js', () => ({
  sendFriendRequestEvent: vi.fn().mockResolvedValue(undefined),
  sendFriendAcceptEvent: vi.fn().mockResolvedValue(undefined),
  sendFriendAddedEvent: vi.fn().mockResolvedValue(undefined),
  sendBlockEvent: vi.fn().mockResolvedValue(undefined),
  sendUnblockEvent: vi.fn().mockResolvedValue(undefined),
}));

const mockUserRepository: UserRepositoryInterface = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByNicknameStartsWith: vi.fn(),
};

const mockFriendRepository: FriendRepositoryInterface = {
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findAllByUserIdAndStatus: vi.fn(),
  findAllByFriendIdAndStatus: vi.fn(),
  findByUserIdAndFriendId: vi.fn(),
  findAllByUserId: vi.fn(),
};

let friendsService: FriendsService;
beforeEach(() => {
  vi.clearAllMocks();
  friendsService = new FriendsService(mockUserRepository, mockFriendRepository);
});

describe('request', () => {
  it('정상적인 친구 요청을 처리해야 함', async () => {
    const userId = 1;
    const friendId = 2;
    (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
    });
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (mockFriendRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await friendsService.request(userId, friendId);
    expect(result).toEqual({
      status: STATUS.SUCCESS,
      message: 'Request processed successfully',
    });
  });
  it('userId가 없으면 NotFoundException을 던져야 함', async () => {
    await expect(friendsService.request(undefined, 2)).rejects.toThrow(NotFoundException);
  });
  it('friendId 유저가 존재하지 않으면 NotFoundException을 던져야 함', async () => {
    (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(friendsService.request(1, 999)).rejects.toThrow(NotFoundException);
  });
  it('자기 자신에게 친구 요청 시 BadRequestException을 던져야 함', async () => {
    (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
    });
    await expect(friendsService.request(1, 1)).rejects.toThrow(BadRequestException);
  });
  it('이미 친구 요청이 있는 경우 ConflictException을 던져야 함', async () => {
    (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
    });
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
    })
    await expect(friendsService.request(1, 2)).rejects.toThrow(ConflictException);
  });
});

describe('accept', () => {
  it('정상적으로 친구 요청을 수락해야 함', async () => {
    const userId = 1;
    const senderId = 2;

    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1,
      userId: senderId,
      friendId: userId,
      status: Status.PENDING,
    })
    // 역방향 친구 관계 없음
    .mockResolvedValueOnce(null);
    (mockFriendRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (mockFriendRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await friendsService.accept(senderId, userId);
    expect(mockFriendRepository.update).toHaveBeenCalledWith(1, {
      status: Status.ACCEPTED,
    });
    expect(mockFriendRepository.create).toHaveBeenCalledWith({
      userId: userId, // reverse direction
      friendId: senderId,
      status: Status.ACCEPTED,
    });
    expect(result.status).toBe(STATUS.SUCCESS);
  });
  it('userId가 undefined이면 NotFoundException을 던져야 함', async () => {
    await expect(() => friendsService.accept(undefined, 2)).rejects.toThrow(NotFoundException);
  });
  it('친구 요청이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    await expect(() => friendsService.accept(2, 1)).rejects.toThrow(NotFoundException);
  });
  it('요청 상태가 PENDING이 아니면 ConflictException을 던져야 함', async () => {
    const friendRequest = {
      id: 11,
      userId: 1,
      friendId: 2,
      status: Status.ACCEPTED, // 이미 수락된 상태
    };
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      friendRequest,
    );
    await expect(() => friendsService.accept(2, 1)).rejects.toThrow(ConflictException);
  });
  it('둘다 친구요청을 했을 때', async () => {
    const friendRequest = {
      id: 11,
      userId: 1,
      friendId: 2,
      status: Status.PENDING,
    };
    const reversedfriendRequest = {
      id: 12,
      userId: 2,
      friendId: 1,
      status: Status.PENDING,
    };
    (
      mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(friendRequest);
    (
      mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(reversedfriendRequest);
    const result = await friendsService.accept(2, 1);
    expect(result.status).toEqual(STATUS.SUCCESS);
  });
});

describe('reject', () => {
  it('정상적인 친구 요청 거절을 처리해야 함', async () => {
    const friendRequest = {
      id: 22,
      userId: 2,
      friendId: 1,
      status: Status.PENDING,
    };
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      friendRequest,
    );
    (mockFriendRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await friendsService.reject(1, 2); // friendId=1이 보낸 요청을 userId=2가 거절
    expect(result).toEqual({
      status: STATUS.SUCCESS,
      message: 'Friend request rejected successfully',
    });
  });
  it('userId가 undefined이면 NotFoundException을 던져야 함', async () => {
    await expect(() => friendsService.reject(undefined, 1)).rejects.toThrowError(NotFoundException);
  });
  it('친구 요청이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    await expect(() => friendsService.reject(2, 1)).rejects.toThrowError(NotFoundException);
  });
  it('요청 상태가 PENDING이 아니면 ConflictException을 던져야 함', async () => {
    const friendRequest = {
      id: 22,
      userId: 1,
      friendId: 2,
      status: Status.ACCEPTED,
    };
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      friendRequest,
    );
    await expect(() => friendsService.reject(2, 1)).rejects.toThrowError(ConflictException);
  });
});
describe('block', () => {
  it('정상적인 친구 요청 차단을 처리해야 함', async () => {
    const mockRequest = {
      id: 1,
      userId: 1,
      friendId: 2,
      status: Status.ACCEPTED,
    };
    // 친구 요청이 있는 경우
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockRequest,
    );
    // 상태 업데이트 성공
    (mockFriendRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await friendsService.block(2, 1); // friendId=1이 보낸 요청을 userId=2가 차단
    expect(result).toEqual({
      status: STATUS.SUCCESS,
      message: 'Friend has been blocked successfully',
    });
  });
  it('userId가 undefined이면 예외를 던져야 함', async () => {
    await expect(friendsService.block(undefined, 2)).rejects.toThrowError(NotFoundException);
  });
  it('친구 관계가 없으면 예외를 던져야 함', async () => {
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    await expect(friendsService.block(1, 2)).rejects.toThrowError(NotFoundException);
  });
  it('친구 상태가 ACCEPTED가 아니면 예외를 던져야 함', async () => {
    const pendingFriend = {
      id: 1,
      userId: 1,
      friendId: 2,
      status: Status.PENDING,
    };
    (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
      pendingFriend,
    );
    await expect(friendsService.block(1, 2)).rejects.toThrowError(ConflictException);
  });
});
describe('unblock', () => {
  it('정상적인 친구 차단 해제를 처리해야 함', async () => {
    const mockBlockedFriend = {
      id: 1,
      userId: 1,
      friendId: 2,
      status: Status.BLOCKED,
    };
    (
      mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockBlockedFriend);
    (mockFriendRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const result = await friendsService.unblock(1, 2);
    expect(result).toEqual({
      status: STATUS.SUCCESS,
      message: 'Friend has been unblocked successfully',
    });
  });
  it('userId가 undefined이면 예외를 던져야 함', async () => {
    await expect(friendsService.unblock(undefined, 2)).rejects.toThrowError(NotFoundException);
  });
  it('친구 관계가 없으면 예외를 던져야 함', async () => {
    (
      mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    await expect(friendsService.unblock(1, 2)).rejects.toThrowError(NotFoundException);
  });
  it('친구 상태가 BLOCKED가 아니면 예외를 던져야 함', async () => {
    const acceptedFriend = {
      id: 1,
      userId: 1,
      friendId: 2,
      status: Status.ACCEPTED,
    };
    (
      mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(acceptedFriend);
    await expect(friendsService.unblock(1, 2)).rejects.toThrowError(ConflictException);
  });
});

describe('getFriends', () => {
  it('userId가 undefined일 경우 예외를 던져야 한다', async () => {
    await expect(friendsService.getFriends(undefined, [Status.ACCEPTED])).rejects.toThrowError(NotFoundException);
  });

  it('주어진 status별로 친구를 조회하고 유저 정보와 함께 반환해야 한다', async () => {
    // GIVEN
    mockFriendRepository.findAllByUserIdAndStatus.mockImplementation((userId: number, status: Status) => {
      if (status === Status.ACCEPTED) return Promise.resolve([{ friendId: 2 }]);
      if (status === Status.BLOCKED) return Promise.resolve([{ friendId: 3 }]);
      return Promise.resolve([]);
    });

    mockUserRepository.findById.mockImplementation((id: number) => {
      if (id === 2) return Promise.resolve({ nickname: 'Alice', avatarUrl: 'https://img1.com' });
      if (id === 3) return Promise.resolve({ nickname: 'Bob', avatarUrl: 'https://img2.com' });
      return null;
    });

    // WHEN
    const result = await friendsService.getFriends(1, [Status.ACCEPTED, Status.BLOCKED]);

    // THEN
    expect(result.status).toBe('SUCCESS');
    expect(result.data.friends).toEqual([
      {
        friendId: 2,
        nickname: 'Alice',
        avatarUrl: 'https://img1.com',
        status: Status.ACCEPTED,
      },
      {
        friendId: 3,
        nickname: 'Bob',
        avatarUrl: 'https://img2.com',
        status: Status.BLOCKED,
      },
    ]);
  });

  it('주어진 status가 없으면 모든 status의 조회 결과를 반환해야 한다', async () => {
    mockFriendRepository.findAllByUserIdAndStatus.mockImplementation((userId: number, status: Status) => {
      if (status === Status.ACCEPTED) return Promise.resolve([{ friendId: 2 }]);
      if (status === Status.BLOCKED) return Promise.resolve([{ friendId: 3 }]);
      if (status === Status.PENDING) return Promise.resolve([{ friendId: 4 }]);
      if (status === Status.REJECTED) return Promise.resolve([{ friendId: 5 }]);
      return Promise.resolve([]);
    });
  
    mockUserRepository.findById.mockImplementation((id: number) => {
      if (id === 2) return Promise.resolve({ nickname: 'Alice', avatarUrl: 'https://img1.com' });
      if (id === 3) return Promise.resolve({ nickname: 'Bob', avatarUrl: 'https://img2.com' });
      if (id === 4) return Promise.resolve({ nickname: 'Anna', avatarUrl: 'https://img3.com' });
      if (id === 5) return Promise.resolve({ nickname: 'Anna', avatarUrl: 'https://img4.com' });
      return null;
    });
  
    // status를 undefined로 넘김
    const result = await friendsService.getFriends(1, undefined);
  
    // 기대 결과 테스트
    expect(mockFriendRepository.findAllByUserIdAndStatus).toHaveBeenCalledTimes(4);
    expect(result.status).toBe('SUCCESS');
  });

  it('친구 ID에 해당하는 유저 정보가 없으면 예외를 던져야 한다', async () => {
    mockFriendRepository.findAllByUserIdAndStatus.mockImplementation((userId: number, status: Status) => {
      if (status === Status.ACCEPTED) return Promise.resolve([{ friendId: 2 }]);

      return Promise.resolve([]);
    });
  
    mockUserRepository.findById.mockImplementation((id: number) => {
      return Promise.resolve(null);
    });

    await expect(friendsService.getFriends(1, [Status.ACCEPTED])).rejects.toThrowError(NotFoundException);
  });
});

describe('getRequests', () => {
    it('대기중인 친구 요청 정상 조회해야 한다', async () => {
      const userId = 1;
      const mockRequests = [
        { userId: 2, friendId: 1 },
        { userId: 3, friendId: 1 },
      ];
      const mockProfiles = [
        { userId: 2, nickname: 'user2', avatarUrl: 'url2' },
        { userId: 3, nickname: 'user3', avatarUrl: 'url3' },
      ];
      
      // mock repo return values
      mockFriendRepository.findAllByFriendIdAndStatus.mockResolvedValue(mockRequests);
      mockUserRepository.findById.mockImplementation((id: number) =>
        mockProfiles.find(profile => profile.userId === id),
    );
    
    const result = await friendsService.getRequests(userId);
    expect(result.status).toBe('SUCCESS');
    expect(result.data.requests.length).toBe(2);
    expect(result.data.requests[0].nickname).toBe('user2');
  });
  
  it('userId가 undefined일 경우 예외를 던져야 한다', async () => {
    const userId = undefined;
    await expect(friendsService.getRequests(userId)).rejects.toThrow(NotFoundException);
  });
  
  it('친구요청이 없으면 빈 배열을 반환한다', async () => {
    const userId = 1;
    const mockRequests: any[] = [];
    mockFriendRepository.findAllByFriendIdAndStatus.mockResolvedValue(mockRequests);
    
    const result = await friendsService.getRequests(userId);
    expect(result.status).toBe('SUCCESS');
    expect(result.data.requests.length).toBe(0);
  });

  it('요청을 보낸 유저의 정보가 없으면 예외를 던져야 한다', async () => {
    mockFriendRepository.findAllByFriendIdAndStatus.mockImplementation((userId: number, status: Status) => {
      if (status === Status.PENDING) return Promise.resolve([{ friendId: 2 }]);

      return Promise.resolve([]);
    });
  
    mockUserRepository.findById.mockImplementation((id: number) => {
      return Promise.resolve(null);
    });

    await expect(friendsService.getRequests(1)).rejects.toThrowError(NotFoundException);
  });
});

describe('getStatus', () => {
  it('친구 관계를 정상 조회해야 한다', async () => {
    const userId = 1;
    const parsed = { user_id: 1, friend_id: 2 };
    const mockFriend = { status: Status.ACCEPTED };
    mockFriendRepository.findByUserIdAndFriendId.mockResolvedValue(mockFriend);

    const result = await friendsService.getStatus(userId, parsed);
    expect(result.status).toBe('SUCCESS');
    expect(result.data.status).toBe(Status.ACCEPTED);
  });

  it('userId가 undefined일 경우 예외를 던져야 한다', async () => {
    const userId = undefined;
    const parsed = { user_id: 1, friend_id: 2 };
    await expect(friendsService.getStatus(userId, parsed)).rejects.toThrow(NotFoundException);
  });

  it('조회하려는 친구관계의 당사자가 아니면 UnAuthorizedException 예외를 던져야 한다', async () => {
    const userId = 1;
    const parsed = { user_id: 2, friend_id: 3 };
    await expect(friendsService.getStatus(userId, parsed)).rejects.toThrow(UnAuthorizedException);
  });

  it('친구 관계가 없으면 NotFoundException 예외를 던져야 한다', async () => {
    const userId = 1;
    const parsed = { user_id: 1, friend_id: 3 };
    mockFriendRepository.findByUserIdAndFriendId.mockResolvedValue(null);

    await expect(friendsService.getStatus(userId, parsed)).rejects.toThrow(NotFoundException);
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STATUS } from '../../../../../src/v1/common/constants/status.js';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '../../../../../src/v1/common/exceptions/core.error.js';
import { Status } from '@prisma/client';
import FriendRepositoryInterface from '../../../../../src/v1/storage/database/interfaces/friend.repository.interface.js';
import UserRepositoryInterface from '../../../../../src/v1/storage/database/interfaces/user.repository.interface.js';
import FriendsService from '../../../../../src/v1/apis/friends/friends.service.js';

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
};

describe('FriendsService', () => {
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
        id: friendId,
        email: 'friend@test.com',
        name: 'Friend',
        password_hash: 'hash',
        two_factor_enabled: false,
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date(),
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
        id: 123,
        userId: 1,
        friendId: 2,
        status: Status.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(friendsService.request(1, 2)).rejects.toThrow(ConflictException);
    });
  });

  describe('accept', () => {
    it('정상적으로 친구 요청을 수락해야 함', async () => {
      const userId = 1;
      const senderId = 2;

      const mockFriend = {
        id: 10,
        userId: senderId,
        friendId: userId,
        status: Status.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 기존 친구 관계(PENDING) 찾기
      (
        mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(mockFriend);

      // 역방향 친구 관계 없음
      (
        mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce(null);

      (mockFriendRepository.update as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (mockFriendRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const result = await friendsService.accept(senderId, userId);

      expect(mockFriendRepository.update).toHaveBeenCalledWith(mockFriend.id, {
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
      await expect(() => friendsService.accept(undefined, 2)).rejects.toThrowError(
        new NotFoundException('User not found'),
      );
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const reversedfriendRequest = {
        id: 11,
        userId: 2,
        friendId: 1,
        status: Status.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
      await expect(() => friendsService.reject(undefined, 1)).rejects.toThrowError(
        new NotFoundException('User not found'),
      );
    });

    it('친구 요청이 존재하지 않으면 NotFoundException을 던져야 함', async () => {
      (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(() => friendsService.reject(2, 1)).rejects.toThrowError(
        new NotFoundException('Friend request not found'),
      );
    });

    it('요청 상태가 PENDING이 아니면 ConflictException을 던져야 함', async () => {
      const friendRequest = {
        id: 22,
        userId: 1,
        friendId: 2,
        status: Status.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
        friendRequest,
      );

      await expect(() => friendsService.reject(2, 1)).rejects.toThrowError(
        new ConflictException('Only pending requests can be rejected'),
      );
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
      await expect(friendsService.block(undefined, 2)).rejects.toThrowError('User not found');
    });

    it('친구 관계가 없으면 예외를 던져야 함', async () => {
      (mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );

      await expect(friendsService.block(1, 2)).rejects.toThrowError('Friend request not found');
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

      await expect(friendsService.block(1, 2)).rejects.toThrowError(
        'Only accepted friends can be blocked',
      );
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
      await expect(friendsService.unblock(undefined, 2)).rejects.toThrowError('User not found');
    });
    it('친구 관계가 없으면 예외를 던져야 함', async () => {
      (
        mockFriendRepository.findByUserIdAndFriendId as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(friendsService.unblock(1, 2)).rejects.toThrowError('Friend request not found');
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
      await expect(friendsService.unblock(1, 2)).rejects.toThrowError(
        'Only blocked friends can be unblocked',
      );
    });
  });

  describe('getFriends', () => {
    it('userId가 undefined면 NotFoundException을 던져야 함', async () => {
      await expect(friendsService.getFriends(undefined)).rejects.toThrow(NotFoundException);
    });
  
    it('친구 목록을 정상적으로 반환해야 함', async () => {
      const userId = 1;
  
      mockFriendRepository.findAllByUserIdAndStatus.mockImplementation((userId, status) => {
        if (status === Status.ACCEPTED) return [{ friendId: 2 }];
        if (status === Status.BLOCKED) return [{ friendId: 3 }];
      });
  
      mockUserRepository.findById.mockImplementation((id) => {
        if (id === 2) {
          return {
            id: 2,
            nickname: 'AcceptedUser',
            avatarUrl: 'https://example.com/accepted.jpg',
          };
        }
        if (id === 3) {
          return {
            id: 3,
            nickname: 'BlockedUser',
            avatarUrl: 'https://example.com/blocked.jpg',
          };
        }
      });
  
      const result = await friendsService.getFriends(userId);
  
      expect(result).toEqual({
        status: STATUS.SUCCESS,
        message: 'Friend list retrieved successfully',
        data: {
          friends: [
            {
              friend_id: 2,
              nickname: 'AcceptedUser',
              avatar_url: 'https://example.com/accepted.jpg',
              status: Status.ACCEPTED,
            },
            {
              friend_id: 3,
              nickname: 'BlockedUser',
              avatar_url: 'https://example.com/blocked.jpg',
              status: Status.BLOCKED,
            },
          ],
        },
      });
  
      expect(mockFriendRepository.findAllByUserIdAndStatus).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
    });
  
    it('userRepository에서 프로필 못 찾으면 NotFoundException을 던져야 함', async () => {
      const userId = 1;
  
      mockFriendRepository.findAllByUserIdAndStatus.mockReturnValue([{ friendId: 999 }]);
      mockUserRepository.findById.mockReturnValue(null); // 프로필 없음
  
      await expect(friendsService.getFriends(userId)).rejects.toThrow(
        new NotFoundException(`유저 ID 999를 찾을 수 없습니다`),
      );
    });
  });
});

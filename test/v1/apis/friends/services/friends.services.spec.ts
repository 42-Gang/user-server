import { describe, it, expect, beforeEach, vi } from 'vitest';
import FriendsService from '../../../../../src/v1/apis/friends/friends.service.js';
import { STATUS } from '../../../../../src/v1/common/constants/status.js';
import { Status } from '@prisma/client';

const mockFriendRepository = {
    findByUserIdAndFriendId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as any;

  describe('FriendsService', () => {
    let service: FriendsService;
  
    beforeEach(() => {
      vi.clearAllMocks();
      service = new FriendsService(mockFriendRepository);
    });
  
    describe('request', () => {
      it('should create a friend request', async () => {
        mockFriendRepository.findByUserIdAndFriendId.mockResolvedValue(null);
        mockFriendRepository.create.mockResolvedValue({});
  
        const result = await service.request(1, 2);
  
        expect(mockFriendRepository.findByUserIdAndFriendId).toHaveBeenCalledWith(1, 2);
        expect(mockFriendRepository.create).toHaveBeenCalledWith({
          userId: 1,
          friendId: 2,
          status: Status.PENDING,
        });
        expect(result).toEqual({
          status: STATUS.SUCCESS,
          message: 'Request processed successfully',
        });
      });
  
      it('should throw if userId is undefined', async () => {
        await expect(service.request(undefined, 2)).rejects.toThrow('User not found');
      });
  
      it('should throw if user sends request to themselves', async () => {
        await expect(service.request(1, 1)).rejects.toThrow();
      });
  
      it('should throw if request already exists', async () => {
        mockFriendRepository.findByUserIdAndFriendId.mockResolvedValue({ id: 1 });
  
        await expect(service.request(1, 2)).rejects.toThrow('Friend Request already exists');
      });
    });
  
    // 여기에 accept, reject, block, unblock 메서드 테스트도 비슷한 형식으로 이어서 작성하면 돼
  });
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersService from '../../../../src/v1/apis/users/users.service.js';
import { STATUS } from '../../../../src/v1/common/constants/status.js';
import {
  ConflictException,
  NotFoundException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';
import bcrypt from 'bcrypt';
import UserRepositoryInterface from '../../../../src/v1/storage/database/interfaces/user.repository.interface.js';
import UserRepositoryPrisma from '../../../../src/v1/storage/database/prisma/user.repository.js';
import mockPrisma from '../../mocks/mockPrisma.js';

let userRepository: UserRepositoryInterface;
let usersService: UsersService;

beforeEach(() => {
  userRepository = new UserRepositoryPrisma(mockPrisma);

  usersService = new UsersService(userRepository, bcrypt, 'http://localhost:3000');
});

describe('회원가입', () => {
  it('정상', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);
    userRepository.create = vi.fn().mockResolvedValue({
      id: 1,
      email: 'test@naver.com',
      nickname: 'tester',
    });

    const result = await usersService.createUser({
      email: 'test@naver.com',
      password: '1234',
      nickname: 'tester',
    });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data!.email).toBe('test@naver.com');
  });

  it('중복 이메일', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue({ id: 1 });

    await expect(
      usersService.createUser({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'tester',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('중복 닉네임', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);
    userRepository.findByNickname = vi.fn().mockResolvedValue({ id: 2 });

    await expect(
      usersService.createUser({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'tester',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('로그인', () => {
  it('정상', async () => {
    const passwordHash = await bcrypt.hash('1234', 10);
    userRepository.findByEmail = vi.fn().mockResolvedValue({
      id: 1,
      passwordHash,
    });

    const result = await usersService.authenticateUser({
      email: 'test@naver.com',
      password: '1234',
    });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('로그인 성공');
  });

  it('유저 없음 또는 비밀번호 없음', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);

    await expect(
      usersService.authenticateUser({
        email: 'test@naver.com',
        password: '1234',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });

  it('비밀번호 틀림', async () => {
    const passwordHash = await bcrypt.hash('wrongpassword', 10);
    userRepository.findByEmail = vi.fn().mockResolvedValue({ id: 1, passwordHash });

    await expect(
      usersService.authenticateUser({
        email: 'test@naver.com',
        password: '1234',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });
});

describe('유저 조회', () => {
  it('정상', async () => {
    userRepository.findById = vi.fn().mockResolvedValue({
      id: 1,
      email: 'test@naver.com',
      nickname: 'tester',
    });

    const result = await usersService.getUser(1);

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data!.id).toBe(1);
  });

  it('존재하지 않는 유저', async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    await expect(usersService.getUser(999)).rejects.toThrow(NotFoundException);
  });
});

describe('닉네임 수정', () => {
  it('정상', async () => {
    userRepository.update = vi.fn().mockResolvedValue({
      id: 1,
      nickname: 'newNick',
    });

    const result = await usersService.editNickname(1, { nickname: 'newNick' });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data!.nickname).toBe('newNick');
  });

  it('업데이트 실패', async () => {
    userRepository.update = vi.fn().mockResolvedValue(null);

    await expect(usersService.editNickname(1, { nickname: 'test' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('유저 검색', () => {
  it('정상', async () => {
    const mockUsers = [
      { id: 1, nickname: 'test1' },
      { id: 2, nickname: 'test2' },
    ];
    userRepository.findByNicknameStartsWith = vi.fn().mockResolvedValue(mockUsers);

    const result = await usersService.searchUser({
      userId: 3,
      nickname: 'test',
      query: {},
    });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data).toBeDefined();
    expect(result.data!.users.length).toBe(2);
    expect(result.data!.users[0].nickname).toMatch(/^test/);
  });

  it('query에 None이 들어갈 경우', async () => {
    const mockUsers = [
      { id: 1, nickname: 'test1' },
      { id: 2, nickname: 'test2' },
    ];
    userRepository.findByNicknameStartsWith = vi.fn().mockResolvedValue(mockUsers);

    const result = await usersService.searchUser({
      userId: 3,
      nickname: 'test',
      query: {
        status: ['NONE'],
      },
    });

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.data).toBeDefined();
    expect(result.data!.users.length).toBe(2);
    expect(result.data!.users[0].nickname).toMatch(/^test/);
  });
});

describe('내정보 확인', () => {
  it('정상', async () => {
    const userId = 1;
    const mockUser = {
      id: userId,
      email: 'abc123@google.com',
      nickname: 'user1',
      avatarUrl: '/avatars/avatar.png',
    };
    userRepository.findById = vi.fn().mockResolvedValue(mockUser);

    const result = await usersService.getMyProfile(userId);
    expect(result).toEqual({
      status: 'SUCCESS',
      message: '프로필을 성공적으로 불러왔습니다.',
      data: {
        id: mockUser.id,
        nickname: mockUser.nickname,
        avatarUrl: 'http://localhost:3000' + mockUser.avatarUrl,
        email: mockUser.email,
      },
    });
  });

  it('유저 ID 없음', async () => {
    const userId = 999;
    userRepository.findById = vi.fn().mockResolvedValue(null);

    await expect(usersService.getMyProfile(userId)).rejects.toThrow(NotFoundException);
  });
});

describe('이메일 중복 확인', () => {
  it('중복 아님 → true 반환', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);

    const result = await usersService.checkDuplicatedEmail('test@naver.com');
    expect(result).toBe(true);
  });

  it('중복 이메일 → ConflictException', async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue({ id: 1 });

    await expect(usersService.checkDuplicatedEmail('test@naver.com')).rejects.toThrow(
      ConflictException,
    );
  });
});

describe('로그인 - userId 포함 확인', () => {
  it('userId 반환', async () => {
    const passwordHash = await bcrypt.hash('1234', 10);
    userRepository.findByEmail = vi.fn().mockResolvedValue({
      id: 123,
      passwordHash,
    });

    const result = await usersService.authenticateUser({
      email: 'test@naver.com',
      password: '1234',
    });

    expect(result.data!.userId).toBe(123);
  });
});

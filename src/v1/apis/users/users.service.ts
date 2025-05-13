import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnAuthorizedException,
} from '../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
import bcrypt from 'bcrypt';
import { createUserInputSchema, createUserResponseSchema } from './schemas/create-user.schema.js';
import { getUserResponseSchema } from './schemas/get-user.schema.js';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
} from './schemas/edit-nickname.schema.js';
import {
  authenticateUserInputSchema,
  authenticateUserResponseSchema,
} from './schemas/authenticate-user.schema.js';
import { getProfileSchema, getProfileResponseSchema } from './schemas/get-profile.schema.js';
import { Status } from '@prisma/client';
import { searchUserQuerySchema } from './schemas/search-user.schema.js';

export default class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly crypt: typeof bcrypt,
  ) {}

  async createUser(
    body: TypeOf<typeof createUserInputSchema>,
  ): Promise<TypeOf<typeof createUserResponseSchema>> {
    if (await this.userRepository.findByEmail(body.email)) {
      throw new ConflictException('이미 가입한 이메일입니다.');
    }

    if (await this.userRepository.findByNickname(body.nickname)) {
      throw new ConflictException('닉네임은 중복될 수 없습니다.');
    }

    const passwordHash = await this.crypt.hash(body.password, 10);
    const user = await this.userRepository.create({
      nickname: body.nickname,
      email: body.email,
      passwordHash: passwordHash,
      avatarUrl: 'https://example.com/avatar.png',
    });

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async authenticateUser(
    body: TypeOf<typeof authenticateUserInputSchema>,
  ): Promise<TypeOf<typeof authenticateUserResponseSchema>> {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user || user.passwordHash === null) {
      throw new UnAuthorizedException('이메일 혹은 비밀번호를 잘못 입력하셨습니다.');
    }

    const passwordValidation = await this.crypt.compare(body.password, user.passwordHash);
    if (!passwordValidation) {
      throw new UnAuthorizedException('이메일 혹은 비밀번호를 잘못 입력하셨습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      message: '로그인 성공',
      data: {
        userId: user.id,
      },
    };
  }

  async getUser(id: number): Promise<TypeOf<typeof getUserResponseSchema>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async editNickname(
    id: number,
    body: TypeOf<typeof editNicknameInputSchema>,
  ): Promise<TypeOf<typeof editNicknameResponseSchema>> {
    const user = await this.userRepository.findByNickname(body.nickname);
    if (user) {
      if (user.id === id) {
        throw new BadRequestException('자기 자신의 닉네임으로 변경할 수 없습니다.');
      }
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    await this.userRepository.update(id, body);

    return {
      status: STATUS.SUCCESS,
      message: '닉네임이 성공적으로 변경되었습니다.',
    };
  }

  async searchUser({
    userId,
    query: { status, exceptMe },
    nickname,
  }: {
    userId: number;
    query: TypeOf<typeof searchUserQuerySchema>;
    nickname: string;
  }) {
    // all: status가 없으면 전체조회, noneFlag: status 배열에 'NONE' 포함 여부
    const all = status === undefined;
    const noneFlag = status?.includes('NONE') ?? false;
    // 실제 사용 가능한 status만 필터
    const realStatuses = status?.filter((s) => s !== 'NONE') as Status[] | undefined;

    const users = await this.userRepository.findByNicknameStartsWith({
      nickname,
      userId,
      exceptMe,
      all,
      noneFlag,
      statuses: realStatuses,
    });

    return {
      status: STATUS.SUCCESS,
      data: { users },
    };
  }

  async checkDuplicatedEmail(email: string): Promise<boolean> {
    const foundEmail = await this.userRepository.findByEmail(email);
    if (foundEmail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    return true;
  }

  async getMyProfile(userId: number): Promise<TypeOf<typeof getProfileResponseSchema>> {
    return {
      status: STATUS.SUCCESS,
      message: '프로필을 성공적으로 불러왔습니다.',
      data: await this.getProfileData(userId),
    };
  }

  private async getProfileData(id: number): Promise<TypeOf<typeof getProfileSchema>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`유저 ID ${id}를 찾을 수 없습니다`);
    }

    return {
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }
}

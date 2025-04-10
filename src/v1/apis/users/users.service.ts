import {
  ConflictException,
  NotFoundException,
  UnAuthorizedException,
} from '../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
import bcrypt from 'bcrypt';
import { createUserInputSchema, createUserResponseSchema } from './schemas/createUser.schema.js';
import { getUserResponseSchema } from './schemas/getUser.schema.js';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
} from './schemas/editNickname.schema.js';
import { searchUserResponseSchema } from './schemas/searchUser.schema.js';
import {
  authenticateUserInputSchema,
  authenticateUserResponseSchema,
} from './schemas/authenticateUser.schema.js';

export default class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly crypt: typeof bcrypt,
  ) {}

  async createUser(
    body: TypeOf<typeof createUserInputSchema>,
  ): Promise<TypeOf<typeof createUserResponseSchema>> {
    if (await this.userRepository.findByEmail(body.email)) {
      throw new ConflictException('User already exists');
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
    };
  }

  async getUser(id: number): Promise<TypeOf<typeof getUserResponseSchema>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async editNickname(
    id: number | undefined,
    body: TypeOf<typeof editNicknameInputSchema>,
  ): Promise<TypeOf<typeof editNicknameResponseSchema>> {
    if (!id) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userRepository.update(id, body);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async searchUser(nickname: string): Promise<TypeOf<typeof searchUserResponseSchema>> {
    const users = await this.userRepository.findByNicknameStartsWith(nickname);

    return {
      status: STATUS.SUCCESS,
      data: users,
    };
  }
}

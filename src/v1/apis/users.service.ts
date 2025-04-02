import { ConflictException, NotFoundException } from '../common/exceptions/core.error.js';
import { z } from 'zod';
import {
  createUserInputSchema,
  createUserResponseSchema,
  editNicknameInputSchema,
  editNicknameResponseSchema,
  getUserResponseSchema,
} from './users.schema.js';
import { STATUS } from '../common/constants/status.js';
import UserRepositoryInterface from '../storage/database/interfaces/user.repository.interface.js';
import bcrypt from 'bcrypt';

export default class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly crypt: typeof bcrypt,
  ) {}

  async createUser(
    body: z.infer<typeof createUserInputSchema>,
  ): Promise<z.infer<typeof createUserResponseSchema>> {
    if (await this.userRepository.findByEmail(body.email)) {
      throw new ConflictException('User already exists');
    }

    const password_hash = await this.crypt.hash(body.password, 10);
    const user = await this.userRepository.create({
      nickname: body.nickname,
      email: body.email,
      password_hash: password_hash,
      avatar_url: 'https://example.com/avatar.png',
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async getUser(id: number): Promise<z.infer<typeof getUserResponseSchema>> {
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
    id: number,
    body: z.infer<typeof editNicknameInputSchema>,
  ): Promise<z.infer<typeof editNicknameResponseSchema>> {
    const user = await this.userRepository.update(id, body);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }
}

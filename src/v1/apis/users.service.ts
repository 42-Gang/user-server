import { NotFoundException } from '../common/exceptions/core.error.js';
import { z } from 'zod';
import { getUserResponseSchema } from './users.schema.js';
import { STATUS } from '../common/constants/status.js';
import UserRepositoryInterface from '../storage/database/interfaces/user.repository.interface.js';
import { UserCacheInterface } from '../storage/cache/interfaces/user.cache.interface.js';
import { User } from '@prisma/client';

export default class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly userCacheRepository: UserCacheInterface,
  ) {}

  private toResponseUser(user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async getUser(id: number): Promise<z.infer<typeof getUserResponseSchema>> {
    const cachedUser = await this.userCacheRepository.getUserById(id);
    if (cachedUser) {
      return {
        status: STATUS.SUCCESS,
        data: this.toResponseUser(cachedUser),
      };
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userCacheRepository.setUserById(user.id, user);

    return {
      status: STATUS.SUCCESS,
      data: this.toResponseUser(user),
    };
  }
}

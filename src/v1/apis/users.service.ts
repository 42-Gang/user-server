import { NotFoundException } from '../common/exceptions/core.error.js';
import { z } from 'zod';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
  getUserResponseSchema,
} from './users.schema.js';
import { STATUS } from '../common/constants/status.js';
import UserRepositoryInterface from '../storage/database/interfaces/user.repository.interface.js';

export default class UsersService {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

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

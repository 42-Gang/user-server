import { Prisma, Status, User } from '@prisma/client';
import { BaseRepositoryInterface } from './base.repository.interface.js';

export type FindUsersInput = {
  nickname: string;
  userId?: number;
  exceptMe?: boolean; // 0: false, 1: true
  all: boolean;
  noneFlag: boolean; // true면 '친구가 없는' 경우
  statuses?: Status[]; // 실제 조회할 상태 배열
};

export default interface UserRepositoryInterface
  extends BaseRepositoryInterface<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  findByEmail(email: string): Promise<User | null>;

  findByNicknameStartsWith(input: FindUsersInput): Promise<User[]>;

  findByNickname(nickname: string): Promise<User | null>;
}

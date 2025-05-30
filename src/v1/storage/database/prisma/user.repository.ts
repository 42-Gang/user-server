import { Prisma, PrismaClient, User } from '@prisma/client';
import UserRepositoryInterface, {
  FindUsersInput,
} from '../interfaces/user.repository.interface.js';

export default class UserRepositoryPrisma implements UserRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  delete(id: number): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findByNicknameStartsWith({
    nickname,
    userId,
    exceptMe,
    all,
    noneFlag,
    statuses,
  }: FindUsersInput): Promise<User[]> {
    // 공통 where: 닉네임, 자신 제외
    const where: Prisma.UserWhereInput = {
      nickname: { startsWith: nickname },
      ...(exceptMe ? { id: { not: userId } } : {}),
    };
    console.log('noneFlag', noneFlag, 'userId', userId, 'all', all, 'statuses', statuses);
    if (!all && userId != null) {
      const orCondition: Prisma.UserWhereInput[] = [];

      if (noneFlag) {
        orCondition.push({
          friendOf: {
            none: {
              userId: userId,
            },
          },
        });
      }
      if (statuses && statuses.length > 0) {
        orCondition.push({
          friendOf: {
            some: {
              userId: userId,
              status: {
                in: statuses,
              },
            },
          },
        });
      }
      if (orCondition.length > 0) {
        where.OR = orCondition;
      }
    }

    return this.prisma.user.findMany({
      where,
      take: 10,
    });
  }

  findByNickname(nickname: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        nickname,
      },
    });
  }
}

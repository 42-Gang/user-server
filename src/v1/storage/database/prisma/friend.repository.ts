import { Prisma, PrismaClient, Friend, Status } from '@prisma/client';
import FriendRepositoryInterface from '../interfaces/friend.repository.interface.js';
import { FriendStatus, UserStatus } from 'src/v1/sockets/status/friends.schema.js';

export default class FriendRepositoryPrisma implements FriendRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.FriendCreateInput): Promise<Friend> {
    return this.prisma.friend.create({ data });
  }

  delete(id: number): Promise<Friend> {
    return this.prisma.friend.delete({ where: { id } });
  }

  findAll(): Promise<Friend[]> {
    return this.prisma.friend.findMany();
  }

  findById(id: number): Promise<Friend | null> {
    return this.prisma.friend.findUnique({ where: { id } });
  }

  findManyByUserIdAndStatus(userId: number, statuses: Status[]): Promise<FriendStatus[]> {
    return this.prisma.friend.findMany({
      where: {
        userId : userId,
        status: { in: statuses },
      },
      include: {
        friend: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  findAllByUserIdAndStatus(userId: number, status: Status): Promise<Friend[]> {
    return this.prisma.friend.findMany({ where: { userId, status } });
  }

  findAllByFriendIdAndStatus(friendId: number, status: Status): Promise<UserStatus[]> {
    return this.prisma.friend.findMany({ 
      where: {
        friendId : friendId,
        status: status,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  findByUserIdAndFriendId({
    userId,
    friendId,
  }: {
    userId: number;
    friendId: number;
  }): Promise<Friend | null> {
    return this.prisma.friend.findFirst({ where: { userId, friendId } });
  }

  update(id: number, data: Prisma.FriendUpdateInput): Promise<Friend> {
    return this.prisma.friend.update({ where: { id }, data });
  }

  findAllByUserId(userId: number): Promise<Friend[]> {
    return this.prisma.friend.findMany({ where: { userId } });
  }
}

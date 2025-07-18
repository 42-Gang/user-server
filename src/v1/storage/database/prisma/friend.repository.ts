import { Prisma, PrismaClient, Friend, Status } from '@prisma/client';
import FriendRepositoryInterface from '../interfaces/friend.repository.interface.js';

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

  findAllByUserIdAndStatus(userId: number, status: Status): Promise<Friend[]> {
    return this.prisma.friend.findMany({ where: { userId, status } });
  }

  async findAllByUserIdAndNotBlocked(userId: number): Promise<Friend[]> {
    return this.prisma.friend.findMany({
      where: {
        friendId: userId,
        status: {
          equals: Status.ACCEPTED,
        },
      },
    });
  }

  findAllByUserIdAndStatuses(
    userId: number,
    statuses: Status[],
  ): Promise<
    Prisma.FriendGetPayload<{
      include: { friend: true };
    }>[]
  > {
    return this.prisma.friend.findMany({
      where: {
        userId,
        status: {
          in: statuses,
        },
      },
      include: { friend: true },
    });
  }

  findAllByFriendIdAndStatus({ friendId, status }: { friendId: number; status: Status }): Promise<
    Prisma.FriendGetPayload<{
      include: { user: true };
    }>[]
  > {
    return this.prisma.friend.findMany({ where: { friendId, status }, include: { user: true } });
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

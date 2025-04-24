import { Prisma, Status, Friend } from '@prisma/client';
import { BaseRepositoryInterface } from './base.repository.interface.js';

export default interface FriendRepositoryInterface
  extends BaseRepositoryInterface<Friend, Prisma.FriendCreateInput, Prisma.FriendUpdateInput> {
  findAllByUserIdAndStatus(userId: number, status: Status): Promise<Friend[]>;

  findAllByUserIdAndStatuses(
    userId: number,
    statuses: Status[],
  ): Promise<
    Prisma.FriendGetPayload<{
      include: { friend: true };
    }>[]
  >;

  findAllByFriendIdAndStatus(friendId: number, status: Status): Promise<Friend[]>;

  findByUserIdAndFriendId({
    userId,
    friendId,
  }: {
    userId: number;
    friendId: number;
  }): Promise<Friend | null>;

  findAllByUserId(userId: number): Promise<Friend[]>;
}

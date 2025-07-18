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

  findAllByUserIdAndNotBlocked(userId: number): Promise<Friend[]>;

  findAllByFriendIdAndStatus(input: { friendId: number; status: Status }): Promise<
    Prisma.FriendGetPayload<{
      include: { user: true };
    }>[]
  >;

  findByUserIdAndFriendId({
    userId,
    friendId,
  }: {
    userId: number;
    friendId: number;
  }): Promise<Friend | null>;

  findAllByUserId(userId: number): Promise<Friend[]>;
}

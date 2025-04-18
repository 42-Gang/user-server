import { Prisma, Friend as friend, Status } from '@prisma/client';
import { BaseRepositoryInterface } from './base.repository.interface.js';

export default interface FriendRepositoryInterface
  extends BaseRepositoryInterface<friend, Prisma.FriendCreateInput, Prisma.FriendUpdateInput> {
  findAllByUserIdAndStatus(userId: number, status: Status): Promise<friend[]>;

  findAllByFriendIdAndStatus(friendId: number, status: Status): Promise<friend[]>;

  findByUserIdAndFriendId({
    userId,
    friendId,
  }: {
    userId: number;
    friendId: number;
  }): Promise<friend | null>;

  findAllByUserId(userId: number): Promise<friend[]>;
}

import { Prisma, Friend as friend, Status } from '@prisma/client';
import { BaseRepositoryInterface } from './base.repository.interface.js';

export default interface FriendRepositoryInterface
  extends BaseRepositoryInterface<friend, Prisma.FriendCreateInput, Prisma.FriendUpdateInput> {
  findByUserIdAndStatus(userId: number, status: Status): Promise<friend[]>;
  findByFriendIdAndStatus(friendId: number, status: Status): Promise<friend[]>;
  findByUserIdAndFriendId(userId: number, friendId: number): Promise<friend | null>;
}

import { BaseCacheInterface } from './base.cache.interface.js';
import { friendSchema, friendsSchema } from '../../../sockets/status/friends.schema.js';
import { TypeOf } from 'zod';

export interface FriendCacheInterface extends BaseCacheInterface<TypeOf<typeof friendsSchema>> {
  addFriend(userId: number, friend: TypeOf<typeof friendSchema>): Promise<void>;

  addFriends(userId: number, friends: TypeOf<typeof friendsSchema>): Promise<void>;

  getFriends(userId: number): Promise<TypeOf<typeof friendsSchema> | null>;
}

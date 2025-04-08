import { BaseCacheInterface } from './base.cache.interface.js';
import { friendSchema, friendsSchema } from '../../../sockets/status/friends.schema.js';
import { TypeOf, z } from 'zod';

export interface FriendCacheInterface extends BaseCacheInterface<z.infer<typeof friendsSchema>> {
  addFriend(userId: number, friend: TypeOf<typeof friendSchema>): Promise<void>;

  addFriends(userId: number, friends: TypeOf<typeof friendsSchema>): Promise<void>;

  getFriends(userId: number): Promise<z.infer<typeof friendsSchema> | null>;
}

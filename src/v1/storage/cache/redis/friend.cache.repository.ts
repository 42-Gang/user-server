import { FriendCacheInterface } from '../interfaces/friend.cache.interface.js';
import { TypeOf } from 'zod';
import { friendSchema, friendsSchema } from '../../../sockets/status/friends.schema.js';
import { Redis } from 'ioredis';

export default class FriendCacheRedis implements FriendCacheInterface {
  constructor(private readonly redisClient: Redis) {}

  private getKey(userId: number): string {
    return `user:${userId}:friends`;
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) > 0;
  }

  async get(key: string): Promise<TypeOf<typeof friendsSchema> | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // 유효성 검증
    return friendsSchema.parse(parsed);
  }

  async set(key: string, value: TypeOf<typeof friendsSchema>, ttlSeconds?: number): Promise<void> {
    const stringified = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.set(key, stringified, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, stringified);
    }
  }

  async addFriends(userId: number, friends: TypeOf<typeof friendsSchema>): Promise<void> {
    for (const friend of friends) {
      await this.addFriend(userId, friend);
    }
  }

  async addFriend(userId: number, friend: TypeOf<typeof friendSchema>): Promise<void> {
    await this.redisClient.sadd(this.getKey(userId), JSON.stringify(friend));
  }

  async getFriends(userId: number): Promise<TypeOf<typeof friendsSchema> | null> {
    const friends = await this.redisClient.smembers(this.getKey(userId));
    if (!friends) return null;
    const parsedFriends = friends.map((friend) => JSON.parse(friend));
    return friendsSchema.parse(parsedFriends);
  }
}

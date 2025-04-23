import { z } from 'zod';
import { Status } from '@prisma/client';

export const friendSchema = z.object({
  friendId: z.number(),
});

export const friendsSchema = z.array(friendSchema);

export const statusSchema = z.object({
  status: z.nativeEnum(Status),
});

export const friendStatusSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(Status),
  userId: z.number(),
  friendId: z.number(),
  friend: z.object({
    id: z.number(),
    nickname: z.string(),
    avatarUrl: z.string(),
  }),
});

export const userStatusSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(Status),
  userId: z.number(),
  friendId: z.number(),
  user: z.object({
    id: z.number(),
    nickname: z.string(),
    avatarUrl: z.string(),
  }),
});

export type FriendStatus = z.infer<typeof friendStatusSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
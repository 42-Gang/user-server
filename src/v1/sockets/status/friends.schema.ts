import { TypeOf, z } from 'zod';
import { Status } from '@prisma/client';

export type friendType = TypeOf<typeof friendsSchema>;

export const friendSchema = z.object({
  id: z.number(),
  userId: z.number(),
  friendId: z.number(),
  status: z.nativeEnum(Status),
});

export const friendsSchema = z.array(friendSchema);

export const statusSchema = z.object({
  status: z.nativeEnum(Status),
});

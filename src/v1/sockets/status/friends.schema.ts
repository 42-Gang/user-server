import { z } from 'zod';
import { Status } from '@prisma/client';

export const friendSchema = z.object({
  friendId: z.number(),
});

export const friendsSchema = z.array(friendSchema);

export const statusSchema = z.object({
  status: z.nativeEnum(Status),
});

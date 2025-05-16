import { z } from 'zod';
import { Status } from '@prisma/client';

export const friendSchema = z.object({
  friendId: z.number().int(),
  nickname: z.string(),
  avatarUrl: z.string().url(),
  status: z.nativeEnum(Status),
});

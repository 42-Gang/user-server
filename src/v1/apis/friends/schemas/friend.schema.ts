import { z } from 'zod';
import { Status } from '@prisma/client';

export const friendSchema = z.object({
  friend_id: z.number().int(),
  nickname: z.string().min(2).max(8),
  avatar_url: z.string().url(),
  status: z.nativeEnum(Status),
});

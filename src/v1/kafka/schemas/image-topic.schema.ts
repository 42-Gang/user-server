import { z } from 'zod';

export const avatarUpdateSchema = z.object({
  userId: z.number(),
  avatarUrl: z.string(),
  timestamp: z.string().optional(),
});

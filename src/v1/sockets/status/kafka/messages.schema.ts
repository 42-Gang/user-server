import { z } from 'zod';

export const userStatusMessage = z.object({
  userId: z.string(),
  status: z.enum(['ONLINE', 'OFFLINE', 'GAME', 'AWAY', 'LOBBY']),
  timestamp: z.string().optional(),
});

export const friendAddMessage = z.object({
  userAId: z.string(),
  userBId: z.string(),
  timestamp: z.string().optional(),
});

export const friendBlockMessage = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  timestamp: z.string().optional(),
});

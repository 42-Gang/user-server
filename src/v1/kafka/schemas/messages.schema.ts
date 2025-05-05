import { z } from 'zod';

export const userStatusMessage = z.object({
  userId: z.number(),
  status: z.enum(['ONLINE', 'OFFLINE', 'GAME', 'AWAY', 'LOBBY']),
  timestamp: z.string(),
});

export const friendAddMessage = z.object({
  userAId: z.number(),
  userBId: z.number(),
  timestamp: z.string(),
});

export const friendMessage = z.object({
  fromUserId: z.number(),
  toUserId: z.number(),
  timestamp: z.string(),
});

export const authLogoutMessage = z.object({
  userId: z.number(),
  timestamp: z.string(),
});

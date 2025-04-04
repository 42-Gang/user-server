import { z } from 'zod';

export const userStatus = z.enum(['ONLINE', 'OFFLINE', 'GAME', 'AWAY', 'LOBBY']);

export const userStatusSchema = z.object({
  userId: z.number(),
  status: userStatus,
});

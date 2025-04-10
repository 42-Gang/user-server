import { z } from 'zod';

export const friendSchema = z.object({
  friendId: z.number(),
});

export const friendsSchema = z.array(friendSchema);

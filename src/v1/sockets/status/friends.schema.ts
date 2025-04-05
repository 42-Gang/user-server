import { z } from 'zod';

export const friendSchema = z.object({
  id: z.number(),
});

export const friendsSchema = z.array(friendSchema);

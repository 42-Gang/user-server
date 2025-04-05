import { z } from 'zod';

export const friendSchema = z.object({
  id: z.number(),
  friend_id: z.number(),
  nickname: z.string(),
});

export const friendsSchema = z.array(friendSchema);

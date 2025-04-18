import { z } from 'zod';

export const getStatusQuerySchema = z.object({
  user_id: z.coerce.number().int(),
  friend_id: z.coerce.number().int(),
});

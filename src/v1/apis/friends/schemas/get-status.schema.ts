import { z } from 'zod';

export const getStatusQuerySchema = z.object({
  userId: z.coerce.number().int(),
  friendId: z.coerce.number().int(),
});

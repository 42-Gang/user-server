import { z } from 'zod';
import { createResponseSchema } from '../../common/schema/core.schema.js';

export const friendRequestSchema = z.object({
  friendId: z.number().int(),
});

export const friendResponseSchema = createResponseSchema(z.any());

export const updateFriendParamsSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

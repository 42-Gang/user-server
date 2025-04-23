import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const getProfileSchema = z.object({
  nickname: z.string().min(2).max(8),
  avatarUrl: z.string().url(),
  // win
  // lose
  // tornament
});

export const getProfileResponseSchema = createResponseSchema(getProfileSchema);

import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const getProfileSchema = z.object({
  nickname: z.string(),
  avatarUrl: z.string(),
  // win
  // lose
  // tornament
});

export const getProfileResponseSchema = createResponseSchema(getProfileSchema);

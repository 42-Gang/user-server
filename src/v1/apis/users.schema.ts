import { createResponseSchema } from '../common/schema/core.schema.js';
import { z } from 'zod';

export const getUserResponseSchema = createResponseSchema(
  z.object({
    id: z.number(),
    nickname: z.string(),
    email: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

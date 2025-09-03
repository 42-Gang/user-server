import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { safeUserSchema, userSchema } from './users.schema.js';
import { z } from 'zod';

export const getUserParamsSchema = userSchema.pick({
  id: true,
});

export const getUserResponseSchema = createResponseSchema(
  safeUserSchema
    .omit({
      createdAt: true,
      updatedAt: true,
    })
    .extend({
      win: z.number(),
      lose: z.number(),
      tournament: z.number(),
    }),
);

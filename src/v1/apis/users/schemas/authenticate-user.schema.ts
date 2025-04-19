import { userSchema } from './users.schema.js';
import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const authenticateUserInputSchema = userSchema
  .pick({
    email: true,
  })
  .extend({
    password: z.string(),
  });

export const authenticateUserResponseSchema = createResponseSchema(
  z.object({
    userId: z.number(),
  }),
);

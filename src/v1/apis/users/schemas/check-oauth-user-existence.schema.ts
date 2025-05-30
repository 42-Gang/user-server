import { userSchema } from './users.schema.js';
import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const oauthUserExistsInputSchema = userSchema
  .pick({
    email: true,
  });

export const oauthUserExistsResponseSchema = createResponseSchema(
  z.object({
    userId: z.number().optional(),
    exists: z.boolean(),
  }),
);

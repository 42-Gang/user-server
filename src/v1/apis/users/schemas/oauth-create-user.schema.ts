import { userSchema } from './users.schema.js';
import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const createOauthUserInputSchema = userSchema
  .pick({
    email: true,
    nickname: true,
  });

export const createOauthUserResponseSchema = createResponseSchema(
  z.object({
    userId: z.number(),
  }),
);

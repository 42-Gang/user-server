import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const getRequestsResponseSchema = createResponseSchema(
  z.object({
    requests: z.array(
      z.object({
        userId: z.number().int(),
        nickname: z.string().min(2).max(8),
        avatarUrl: z.string().url(),
      }),
    ),
  }),
);

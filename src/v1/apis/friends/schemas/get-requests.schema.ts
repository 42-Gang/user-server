import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const getRequestsResponseSchema = createResponseSchema(
  z.object({
    requests: z.array(
      z.object({
        user_id: z.number().int(),
        nickname: z.string().min(2).max(8),
        avatar_url: z.string().url(),
      }),
    ),
  }),
);

import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { userSchema } from '../../users/schemas/users.schema.js';

export const getRequestsResponseSchema = createResponseSchema(
  z.object({
    requests: z.array(
      userSchema
        .pick({
          nickname: true,
          avatarUrl: true,
        })
        .extend({
          userId: z.number(),
          timestamp: z.string().datetime(),
        }),
    ),
  }),
);

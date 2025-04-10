import { z } from 'zod';

import { createResponseSchema } from '../../common/schema/core.schema.js';
import { Status } from '@prisma/client';

export const friendRequestSchema = z.object({
  friendId: z.number().int(),
});

export const friendResponseSchema = createResponseSchema(z.any());

export const friendListResponseSchema = createResponseSchema(
  z.array(
    z.object({
      id: z.number().int(),
      userId: z.number().int(),
      friendId: z.number().int(),
      status: z.nativeEnum(Status),
    }),
  ),
);

export const updateFriendParamsSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

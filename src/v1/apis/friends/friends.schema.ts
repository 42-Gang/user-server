import { z } from 'zod';

import { createResponseSchema } from '../../common/schema/core.schema.js';
import { Status } from '@prisma/client';

export const friendRequestSchema = z.object({
  friendId: z.number().int(),
});

export const friendResponseSchema = createResponseSchema(z.any());

export const friendListResponseSchema = createResponseSchema(
  z.object({
    friends: z.array(
      z.object({
        friend_id: z.number().int(),
        nickname: z.string().min(2).max(8),
        avatar_url: z.string().url(),
        status: z.nativeEnum(Status),
      }),
    ),
  }),
);

export const updateFriendParamsSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
});

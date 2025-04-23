import { z } from 'zod';
import { Status } from '@prisma/client'; // 혹은 enum Status 선언된 곳
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const getFriendsQuerySchema = z.object({
  status: z.preprocess(
    (val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val]),
    z.array(z.nativeEnum(Status)).optional(),
  ),
});

export const friendListResponseSchema = createResponseSchema(
  z.object({
    friends: z.array(
      z.object({
        friendId: z.number().int(),
        nickname: z.string().min(2).max(8),
        avatarUrl: z.string().url(),
        status: z.nativeEnum(Status),
      }),
    ),
  }),
);

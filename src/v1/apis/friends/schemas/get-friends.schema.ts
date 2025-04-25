import { z } from 'zod';
import { Status } from '@prisma/client'; // 혹은 enum Status 선언된 곳
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { friendSchema } from './friend.schema.js';

export const getFriendsQuerySchema = z.object({
  status: z.preprocess(
    (status) => {
      if (Array.isArray(status)) {
        return status;
      }
      return [status];
    },
    z.array(z.nativeEnum(Status)),
  ),
});

export const friendListResponseSchema = createResponseSchema(
  z.object({
    friends: z.array(friendSchema),
  }),
);

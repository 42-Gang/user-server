import { exceptedSensitiveFields, userSchema } from './users.schema.js';
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';
import { Status } from '@prisma/client';

export const searchUserParamsSchema = userSchema.pick({
  nickname: true,
});

export const searchUserQuerySchema = z.object({
  status: z.preprocess(
    (status) => {
      if (status === undefined) {
        return [];
      }
      if (Array.isArray(status)) {
        return status;
      }
      return [status];
    },
    z.array(z.nativeEnum(Status)),
  ),
  exceptMe: z.boolean().optional(),
});

export const searchUserResponseSchema = createResponseSchema(
  z.object({
    users: z.array(exceptedSensitiveFields),
  }),
);

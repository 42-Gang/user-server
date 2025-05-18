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
        return undefined;
      }
      if (Array.isArray(status)) {
        return status;
      }
      return [status];
    },
    z
      .array(
        z.nativeEnum({
          ...Status,
          NONE: 'NONE',
        }),
      )
      .superRefine((val, ctx) => {
        if (val.includes('NONE') && 1 < val.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '상태를 NONE으로 설정할 경우 다른 상태를 설정할 수 없습니다.',
          });
        }
      })
      .optional(),
  ),
  exceptMe: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === 'true' || val === 1) return true;
    if (val === 'false' || val === 0) return false;
    return val;
  }, z.boolean().optional()),
});

export const searchUserResponseFields = exceptedSensitiveFields.omit({
  createdAt: true,
  updatedAt: true,
  email: true,
});

export const searchUserResponseSchema = createResponseSchema(
  z.object({
    users: z.array(searchUserResponseFields),
  }),
);

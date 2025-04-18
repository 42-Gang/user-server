import { exceptedSensitiveFields, userSchema } from './users.schema.js';
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .max(20, '비밀번호는 최대 20자까지 가능합니다.')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    '비밀번호는 대소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.',
  );

export const createUserInputSchema = userSchema
  .pick({
    nickname: true,
    email: true,
  })
  .extend({
    password: passwordSchema,
  });

export const createUserResponseSchema = createResponseSchema(exceptedSensitiveFields);

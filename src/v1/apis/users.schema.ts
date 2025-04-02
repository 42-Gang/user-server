import { z } from 'zod';
import { createResponseSchema } from '../common/schema/core.schema.js';

export const userSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()),
  nickname: z.string().min(2).max(8),
  email: z.string().email(),
  password_hash: z.string().optional(),
  avatar_url: z.string(),
  two_factor_auth: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

// createUser

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

export const createUserResponseSchema = createResponseSchema(
  userSchema.omit({
    password_hash: true,
    two_factor_auth: true,
  }),
);

// getUser

export const getUserParamsSchema = userSchema.pick({
  id: true,
});

export const getUserResponseSchema = createResponseSchema(
  userSchema.omit({
    password_hash: true,
    two_factor_auth: true,
  }),
);

// editNickname

export const editNicknameInputSchema = userSchema.pick({
  nickname: true,
});

export const editNicknameParamsSchema = userSchema.pick({
  id: true,
});

export const editNicknameResponseSchema = createResponseSchema(
  userSchema.omit({
    password_hash: true,
    two_factor_auth: true,
  }),
);

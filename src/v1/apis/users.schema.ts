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

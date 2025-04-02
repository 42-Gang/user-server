import { z } from 'zod';

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

export const exceptedSensitiveFields = userSchema.omit({
  password_hash: true,
  two_factor_auth: true,
});

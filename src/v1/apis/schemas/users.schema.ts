import { z } from 'zod';

export const userSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()).default(150),
  nickname: z.string().min(2).max(8).default('kungbi'),
  email: z.string().email().default('kungbi@gmail.com'),
  password_hash: z.string().optional().default('#@(ghdgr9Y*$W'),
  avatar_url: z.string().default('https://example.com/avatar.png'),
  two_factor_auth: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
});

export const exceptedSensitiveFields = userSchema.omit({
  password_hash: true,
  two_factor_auth: true,
});

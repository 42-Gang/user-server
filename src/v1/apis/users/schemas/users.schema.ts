import { z } from 'zod';

export const userSchema = z.object({
  id: z.preprocess((val) => Number(val), z.number()).default(150),
  nickname: z.string().min(2).max(8),
  email: z.string().email(),
  passwordHash: z.string().optional(),
  avatarUrl: z.string().url(),
  twoFactorAuth: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const exceptedSensitiveFields = userSchema.omit({
  passwordHash: true,
  twoFactorAuth: true,
});

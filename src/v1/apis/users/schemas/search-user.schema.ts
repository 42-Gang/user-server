import { exceptedSensitiveFields, userSchema } from './users.schema.js';
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

export const searchUserParamsSchema = userSchema.pick({
  nickname: true,
});

export const searchUserResponseSchema = createResponseSchema(z.array(exceptedSensitiveFields));

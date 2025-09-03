import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { safeUserSchema, userSchema } from './users.schema.js';

export const getUserParamsSchema = userSchema.pick({
  id: true,
});

export const getUserResponseSchema = createResponseSchema(
  safeUserSchema.omit({
    createdAt: true,
    updatedAt: true,
  }),
);

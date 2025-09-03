import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { safeUserSchema } from './users.schema.js';

export const getProfileSchema = safeUserSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const getProfileResponseSchema = createResponseSchema(getProfileSchema);

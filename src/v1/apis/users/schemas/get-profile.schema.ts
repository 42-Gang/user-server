import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { exceptedSensitiveFields } from './users.schema.js';

export const getProfileSchema = exceptedSensitiveFields.omit({
  createdAt: true,
  updatedAt: true,
});

export const getProfileResponseSchema = createResponseSchema(getProfileSchema);

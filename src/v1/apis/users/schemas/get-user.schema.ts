import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { exceptedSensitiveFields, userSchema } from './users.schema.js';

export const getUserParamsSchema = userSchema.pick({
  id: true,
});

export const getUserResponseSchema = createResponseSchema(
  exceptedSensitiveFields.omit({
    createdAt: true,
    updatedAt: true,
  }),
);

import { exceptedSensitiveFields, userSchema } from './users.schema.js';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const editNicknameInputSchema = userSchema.pick({
  nickname: true,
});

export const editNicknameResponseSchema = createResponseSchema(exceptedSensitiveFields);

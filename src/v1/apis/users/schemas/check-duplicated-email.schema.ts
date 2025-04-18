import { userSchema } from './users.schema.js';

export const checkDuplicatedEmailParamsSchema = userSchema.pick({
  email: true,
});

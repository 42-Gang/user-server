import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const uploadAvatarResponseSchema = createResponseSchema(
  z.object({
    url: z.string().url(),
  }),
);

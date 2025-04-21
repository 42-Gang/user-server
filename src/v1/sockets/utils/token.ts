import { decode } from 'js-base64';
import { BadRequestException } from '../../common/exceptions/core.error.js';
import { TypeOf, z } from 'zod';

const _decodeJwtPayloadSchema = z.object({
  userId: z.number(),
  iat: z.date(),
  exp: z.date(),
});

export function decodeJwtPayload(token: string): TypeOf<typeof _decodeJwtPayloadSchema> {
  const payload = token.split('.')[1];
  if (!payload) throw new BadRequestException('JWT 형식이 잘못되었습니다.');
  const decoded = decode(payload);
  return JSON.parse(decoded);
}

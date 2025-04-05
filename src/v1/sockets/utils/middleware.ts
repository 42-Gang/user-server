import { BadRequestException, UnAuthorizedException } from '../../common/exceptions/core.error.js';
import { gotClient } from '../../../plugins/http.client.js';
import { Socket } from 'socket.io';
import { decode } from 'js-base64';

type NextFunction = (err?: Error) => void;

export async function socketMiddleware(socket: Socket, next: NextFunction) {
  try {
    const token = socket.handshake.query.token;
    if (Array.isArray(token)) {
      throw new BadRequestException('token은 배열이 될 수 없습니다.');
    }
    if (token === '') {
      throw new BadRequestException('token은 빈 문자열이 될 수 없습니다.');
    }
    if (!token) {
      throw new BadRequestException('token이 없습니다.');
    }

    const response = await gotClient.request({
      method: 'POST',
      url: 'http://localhost:8080/auth/v1/token/verify',
      body: {
        access_token: token,
      },
    });
    if (response.statusCode !== 200) {
      throw new UnAuthorizedException('인증되지 않은 사용자입니다.');
    }

    const payload = token.split('.')[1];
    console.log('payload', payload);
    const decodedPayload = decode(payload);
    const payloadObject: { id: number } = JSON.parse(decodedPayload);

    socket.data.userId = Number(payloadObject.id);
    next();
  } catch (e) {
    console.error('Socket middleware error:', e);
    next(e as Error);
  }
}

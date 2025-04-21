// utils/auth.ts
import { gotClient } from '../../../plugins/http.client.js';

export async function verifyAccessToken(token: string): Promise<number> {
  const response = await gotClient.request({
    method: 'POST',
    url: `http://${process.env.AUTH_SERVER}/api/v1/auth/token/verify`,
    body: { access_token: token },
  });

  return response.statusCode;
}

import { gotClient } from '../../../plugins/http.client.js';

export async function verifyAccessToken(token: string): Promise<number> {
  const response = await gotClient.request({
    method: 'POST',
    url: `http://${process.env.AUTH_SERVER}/api/v1/auth/validate-token`,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return response.statusCode;
}

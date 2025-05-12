import { GotClient } from '../../../plugins/http.client.js';
import { HttpException } from '../../common/exceptions/core.error.js';

export default class FileService {
  constructor(
    private readonly httpClient: GotClient,
    private readonly fileServerUrl: string,
  ) {
    if (!fileServerUrl) {
      throw new Error('fileServerUrl is required and must be a non-empty string');
    }
  }

  async getUrl(key: string): Promise<string> {
    const response = await this.httpClient.request<{
      message: string;
      data: {
        url: string;
      };
    }>({
      url: `http://${this.fileServerUrl}/api/v1/file/url`,
      method: 'GET',
      headers: {
        'x-internal': 'true',
      },
      queryParams: {
        key,
      },
    });

    console.log(response, 'response');

    if (response.statusCode !== 200) {
      throw new HttpException(response.statusCode, response.body.message);
    }

    return response.body.data.url;
  }
}

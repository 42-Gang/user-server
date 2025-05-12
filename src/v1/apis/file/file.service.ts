import { GotClient } from '../../../plugins/http.client.js';
import { HttpException } from '../../common/exceptions/core.error.js';
import { MultipartFile } from '@fastify/multipart';
import FormData from 'form-data';
import got from 'got';

export default class FileService {
  constructor(
    private readonly httpClient: GotClient,
    private readonly fileServerUrl: string,
  ) {
    if (!fileServerUrl) {
      throw new Error('fileServerUrl is required and must be a non-empty string');
    }
  }

  async upload(file: MultipartFile, key: string): Promise<string> {
    const buffer = await file.toBuffer();

    const form = new FormData();
    form.append(key, buffer, {
      filename: file.filename,
      contentType: file.mimetype,
    });

    const response = await got.post(`http://${this.fileServerUrl}/api/v1/file`, {
      headers: {
        'x-internal': 'true',
        ...form.getHeaders(),
      },
      body: form,
      throwHttpErrors: false,
    });

    const parsed: {
      message: string;
      data?: {
        url: string;
      };
    } = JSON.parse(response.body);

    if (response.statusCode !== 201) {
      throw new HttpException(response.statusCode, parsed.message);
    }
    if (!parsed.data) {
      throw new HttpException(500, 'File upload failed');
    }

    return parsed.data.url;
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

    if (response.statusCode !== 200) {
      throw new HttpException(response.statusCode, response.body.message);
    }

    console.log('response', response.body);

    return response.body.data.url;
  }
}

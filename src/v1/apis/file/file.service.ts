import { GotClient } from '../../../plugins/http.client.js';
import { HttpException } from '../../common/exceptions/core.error.js';
import { MultipartFile } from '@fastify/multipart';
import FormData from 'form-data';

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

    const response = await this.httpClient.requestForm<{
      message: string;
      data?: {
        url: string;
      };
    }>({
      method: 'POST',
      url: `http://${this.fileServerUrl}/api/v1/file`,
      headers: {
        'x-internal': 'true',
        ...form.getHeaders(),
      },
      body: form,
      throwHttpErrors: false,
    });

    if (response.statusCode !== 201) {
      throw new HttpException(response.statusCode, response.body.message);
    }
    if (!response.body.data) {
      throw new HttpException(500, 'File upload failed');
    }

    return response.body.data.url;
  }

  async getUrl(key: string): Promise<string> {
    const response = await this.httpClient.requestJson<{
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

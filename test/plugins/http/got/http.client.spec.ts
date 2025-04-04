import { describe, expect, it } from 'vitest';
import { gotClient } from '../../../../src/plugins/http.client.js';

describe('HTTP Client', () => {
  it('GET jsonplaceholder.typicode.com', async () => {
    const result = await gotClient.request<{ userId: number }>({
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
    });

    expect(result.body.userId).toBe(1);
  });

  it('GET 404 test', async () => {
    const result = await gotClient.request({
      method: 'GET',
      url: 'http://localhost:3000/asoefijoiejfoiawjfo',
    });

    console.log(result.statusCode);
    expect(result.statusCode).toBe(404);
  });

  it('GET not exist url', async () => {
    const result = await gotClient.request({
      method: 'GET',
      url: 'http://oasiejfoaiejfoiawjefoaiwejfoaeijfow',
    });

    console.log(result.statusCode);
    expect(result.statusCode).toBe(404);
  });

  it('POST jsonplaceholder.typicode.com', async () => {
    const result = await gotClient.request({
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      body: {
        userId: 1,
        id: 3,
        title: 'jungslee ',
        body: 'new post',
      },
    });

    expect(result.statusCode).toBe(201);
  });

  it('PUT jsonplaceholder.typicode.com', async () => {
    const result = await gotClient.request({
      method: 'PUT',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      body: {
        id: 1,
        title: 'foo',
        body: 'bar',
        userId: 1,
      },
    });

    expect(result.statusCode).toBe(200);
  });

  it('DELETE jsonplaceholder.typicode.com', async () => {
    const result = await gotClient.request({
      method: 'DELETE',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
    });

    expect(result.statusCode).toBe(200);
  });
});

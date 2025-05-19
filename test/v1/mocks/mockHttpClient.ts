import { GotClient } from '../../../src/plugins/http.client.js';
import { vi } from 'vitest';

export const mockHttpClient: GotClient = {
  requestForm: vi.fn(),
  requestJson: vi.fn(),
} as unknown as GotClient;

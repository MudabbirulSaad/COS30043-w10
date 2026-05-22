import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';

describe('health endpoint', () => {
  it('reports the API is available', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

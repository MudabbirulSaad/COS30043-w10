import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';

describe('destinations API', () => {
  it('lists destinations with pagination metadata', async () => {
    const pool = {
      execute: async (sql) => {
        if (sql.includes('COUNT(*)')) {
          return [[{ total: 15 }]];
        }

        return [
          [
            {
              id: 1,
              name: 'Bondi Beach',
              country: 'Australia',
              category: 'Ocean',
              description: 'Popular beach in Sydney known for surfing and coastal walks.',
              rating: '4.8'
            }
          ]
        ];
      }
    };

    const response = await request(createApp({ pool })).get('/api/destinations?page=1&pageSize=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: 1,
          name: 'Bondi Beach',
          country: 'Australia',
          category: 'Ocean',
          description: 'Popular beach in Sydney known for surfing and coastal walks.',
          rating: 4.8
        }
      ],
      pagination: {
        page: 1,
        pageSize: 5,
        total: 15,
        totalPages: 3
      }
    });
  });
});

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

  it('creates a destination from valid form data', async () => {
    const pool = {
      execute: async (sql) => {
        if (sql.startsWith('INSERT INTO travel_destinations')) {
          return [{ insertId: 16 }];
        }

        return [
          [
            {
              id: 16,
              name: 'Queenstown',
              country: 'New Zealand',
              category: 'Mountain',
              description: 'Lakeside town known for alpine scenery and adventure activities.',
              rating: '4.8'
            }
          ]
        ];
      }
    };

    const response = await request(createApp({ pool })).post('/api/destinations').send({
      name: 'Queenstown',
      country: 'New Zealand',
      category: 'Mountain',
      description: 'Lakeside town known for alpine scenery and adventure activities.',
      rating: 4.8
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 16,
      name: 'Queenstown',
      country: 'New Zealand',
      category: 'Mountain',
      description: 'Lakeside town known for alpine scenery and adventure activities.',
      rating: 4.8
    });
  });
});

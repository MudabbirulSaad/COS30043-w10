import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';

describe('destinations API', () => {
  it('lists destinations with pagination metadata', async () => {
    const pool = {
      execute: async (sql) => {
        if (sql.includes('COUNT(*)')) return [[{ total: 15 }]];
        return [[{ id: 1, name: 'Bondi Beach', country: 'Australia', category: 'Ocean', description: 'Popular beach in Sydney known for surfing and coastal walks.', rating: '4.8' }]];
      }
    };

    const response = await request(createApp({ pool })).get('/api/destinations?page=1&pageSize=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ id: 1, name: 'Bondi Beach', country: 'Australia', category: 'Ocean', description: 'Popular beach in Sydney known for surfing and coastal walks.', rating: 4.8 }],
      pagination: { page: 1, pageSize: 5, total: 15, totalPages: 3 }
    });
  });

  it('creates a destination from valid form data', async () => {
    const pool = {
      execute: async (sql) => {
        if (sql.startsWith('INSERT INTO travel_destinations')) return [{ insertId: 16 }];
        return [[{ id: 16, name: 'Queenstown', country: 'New Zealand', category: 'Mountain', description: 'Lakeside town known for alpine scenery and adventure activities.', rating: '4.8' }]];
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
    expect(response.body).toEqual({ id: 16, name: 'Queenstown', country: 'New Zealand', category: 'Mountain', description: 'Lakeside town known for alpine scenery and adventure activities.', rating: 4.8 });
  });

  it('rejects invalid destination data', async () => {
    const response = await request(createApp({ pool: { execute: async () => [] } }))
      .post('/api/destinations')
      .send({ name: '', country: '', category: 'City', description: '', rating: 7 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual({
      name: 'This field is required.',
      country: 'This field is required.',
      description: 'This field is required.',
      rating: 'Rating must be a number between 0 and 5.'
    });
  });

  it('updates an existing destination', async () => {
    let updateSql = '';
    const pool = {
      execute: async (sql) => {
        if (sql.startsWith('UPDATE travel_destinations')) {
          updateSql = sql;
          return [{ affectedRows: 1 }];
        }
        return [[{ id: 5, name: 'Paris', country: 'France', category: 'City', description: 'Historic city known for museums, food, and architecture.', rating: '4.9' }]];
      }
    };

    const response = await request(createApp({ pool })).put('/api/destinations/5').send({
      name: 'Paris',
      country: 'France',
      category: 'City',
      description: 'Historic city known for museums, food, and architecture.',
      rating: 4.9
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 5, name: 'Paris', country: 'France', category: 'City', description: 'Historic city known for museums, food, and architecture.', rating: 4.9 });
    expect(updateSql).toContain('updated_at = CURRENT_TIMESTAMP');
  });

  it('returns not found when updating a missing destination', async () => {
    const pool = { execute: async () => [{ affectedRows: 0 }] };

    const response = await request(createApp({ pool })).put('/api/destinations/999').send({
      name: 'Missing',
      country: 'Nowhere',
      category: 'City',
      description: 'This destination does not exist.',
      rating: 3
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Destination not found.' });
  });

  it('deletes an existing destination', async () => {
    const pool = { execute: async () => [{ affectedRows: 1 }] };

    const response = await request(createApp({ pool })).delete('/api/destinations/8');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('returns not found when deleting a missing destination', async () => {
    const pool = { execute: async () => [{ affectedRows: 0 }] };

    const response = await request(createApp({ pool })).delete('/api/destinations/999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Destination not found.' });
  });
});

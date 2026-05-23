import express from 'express';
import cors from 'cors';
import { createDestinationsRouter } from './destinations.js';

export function createApp({ pool } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  if (pool) {
    const destinations = createDestinationsRouter({ pool });
    app.get('/api/destinations', destinations.list);
    app.post('/api/destinations', destinations.create);
    app.put('/api/destinations/:id', destinations.update);
  }

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}

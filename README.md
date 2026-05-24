# Lab 10 Travel CRUD

Single-page CRUD application for COS30043 Lab 10. The app uses Vite for the frontend, a small Express API for CRUD operations, and MySQL for the travel destination table.

## Requirements Covered

- MySQL table for `travel.csv` with an auto-increment primary key.
- Vite web application.
- Create, read, update, and delete operations through the web interface.
- Paginated destination table.
- Dockerized MySQL database for local development.
- Environment variables loaded with `dotenvx`.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment config:

   ```bash
   cp .env.example .env
   ```

   The default local database port is `3307` so it does not clash with another MySQL or MariaDB instance already using `3306`.

3. Start MySQL:

   ```bash
   docker compose up -d
   ```

4. Seed the table from `travel.csv`:

   ```bash
   npm run db:seed
   ```

5. Start the API:

   ```bash
   npm run server
   ```

6. Start the Vite frontend in another terminal:

   ```bash
   npm run dev
   ```

If port `3000` is already busy, set matching ports before starting both apps:

```bash
APP_PORT=3002 npm run server
VITE_API_BASE_URL=http://localhost:3002 npm run dev -- --port 5175
```

## Useful Commands

```bash
npm test
npm run build
npm run db:seed
docker compose ps
docker compose down
```

## API

- `GET /api/destinations?page=1&pageSize=5`
- `POST /api/destinations`
- `PUT /api/destinations/:id`
- `DELETE /api/destinations/:id`

Destination fields:

```json
{
  "name": "Queenstown",
  "country": "New Zealand",
  "category": "Mountain",
  "description": "Lakeside town known for alpine scenery and adventure activities.",
  "rating": 4.8
}
```

## Demo Checklist

- Show Docker MySQL running with `docker compose ps`.
- Run `npm run db:seed` to reset the dataset.
- Run `npm test` to show API behavior coverage.
- Open the Vite app and show:
  - records displayed in a table
  - pagination across pages
  - adding a destination
  - editing the new destination
  - deleting it
  - validation for missing fields or invalid rating

## Mercury Notes

For Mercury deployment, use the same database schema from `db/schema.sql` and configure the deployed environment with the production MySQL values. Do not upload local `.env` secrets. Submit the final Mercury URL on Canvas after confirming the deployed API can connect to the Mercury MySQL database.

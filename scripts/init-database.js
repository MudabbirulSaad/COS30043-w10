import '@dotenvx/dotenvx/config';
import fs from 'node:fs/promises';
import { createPoolFromEnv } from '../server/mysql.js';

const schemaPath = new URL('../db/schema.sql', import.meta.url);
const pool = createPoolFromEnv();
const schema = await fs.readFile(schemaPath, 'utf8');
const statements = schema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await pool.query(statement);
  }
} finally {
  await pool.end();
}

console.log('Database schema initialized.');

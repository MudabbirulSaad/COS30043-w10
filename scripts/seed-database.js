import '@dotenvx/dotenvx/config';
import fs from 'node:fs/promises';
import { createPoolFromEnv } from '../server/mysql.js';

const csvPath = new URL('../travel.csv', import.meta.url);

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  values.push(current);
  return values;
}

function parseTravelCsv(csv) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  const columns = parseCsvLine(header);

  return rows.map((row) => {
    const values = parseCsvLine(row);
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
}

const pool = createPoolFromEnv();
const csv = await fs.readFile(csvPath, 'utf8');
const destinations = parseTravelCsv(csv);

await pool.query('TRUNCATE TABLE travel_destinations');

for (const destination of destinations) {
  await pool.execute(
    `INSERT INTO travel_destinations (name, country, category, description, rating)
     VALUES (?, ?, ?, ?, ?)`,
    [
      destination.name,
      destination.country,
      destination.category,
      destination.description,
      Number(destination.rating)
    ]
  );
}

await pool.end();
console.log(`Seeded ${destinations.length} travel destinations.`);

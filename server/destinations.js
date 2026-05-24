const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readId(value) {
  return toPositiveInteger(value, null);
}

function mapDestination(row) {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    category: row.category,
    description: row.description,
    rating: Number(row.rating)
  };
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readDestinationInput(body) {
  const destination = {
    name: cleanText(body.name),
    country: cleanText(body.country),
    category: cleanText(body.category),
    description: cleanText(body.description),
    rating: Number(body.rating)
  };

  const errors = {};

  for (const field of ['name', 'country', 'category', 'description']) {
    if (!destination[field]) {
      errors[field] = 'This field is required.';
    }
  }

  if (!Number.isFinite(destination.rating) || destination.rating < 0 || destination.rating > 5) {
    errors.rating = 'Rating must be a number between 0 and 5.';
  }

  return { destination, errors };
}

async function findDestination(pool, id) {
  const [rows] = await pool.execute(
    `SELECT id, name, country, category, description, rating
     FROM travel_destinations
     WHERE id = ?`,
    [id]
  );

  return rows[0] ? mapDestination(rows[0]) : null;
}

export function createDestinationsRouter({ pool }) {
  if (!pool) {
    throw new Error('A MySQL pool is required for destination routes.');
  }

  return {
    async list(request, response, next) {
      try {
        const page = toPositiveInteger(request.query.page, DEFAULT_PAGE);
        const requestedPageSize = toPositiveInteger(request.query.pageSize, DEFAULT_PAGE_SIZE);
        const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
        const offset = (page - 1) * pageSize;

        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM travel_destinations');
        const [rows] = await pool.execute(
          `SELECT id, name, country, category, description, rating
           FROM travel_destinations
           ORDER BY id
           LIMIT ? OFFSET ?`,
          [pageSize, offset]
        );

        response.json({
          data: rows.map(mapDestination),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        });
      } catch (error) {
        next(error);
      }
    },

    async create(request, response, next) {
      try {
        const { destination, errors } = readDestinationInput(request.body);

        if (Object.keys(errors).length > 0) {
          response.status(400).json({ errors });
          return;
        }

        const [result] = await pool.execute(
          `INSERT INTO travel_destinations (name, country, category, description, rating)
           VALUES (?, ?, ?, ?, ?)`,
          [destination.name, destination.country, destination.category, destination.description, destination.rating]
        );

        const created = await findDestination(pool, result.insertId);
        response.status(201).json(created);
      } catch (error) {
        next(error);
      }
    },

    async update(request, response, next) {
      try {
        const id = readId(request.params.id);

        if (!id) {
          response.status(404).json({ error: 'Destination not found.' });
          return;
        }

        const { destination, errors } = readDestinationInput(request.body);

        if (Object.keys(errors).length > 0) {
          response.status(400).json({ errors });
          return;
        }

        const [result] = await pool.execute(
          `UPDATE travel_destinations
           SET name = ?, country = ?, category = ?, description = ?, rating = ?
           WHERE id = ?`,
          [destination.name, destination.country, destination.category, destination.description, destination.rating, id]
        );

        if (result.affectedRows === 0) {
          response.status(404).json({ error: 'Destination not found.' });
          return;
        }

        const updated = await findDestination(pool, id);
        response.json(updated);
      } catch (error) {
        next(error);
      }
    },

    async remove(request, response, next) {
      try {
        const id = readId(request.params.id);

        if (!id) {
          response.status(404).json({ error: 'Destination not found.' });
          return;
        }

        const [result] = await pool.execute('DELETE FROM travel_destinations WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
          response.status(404).json({ error: 'Destination not found.' });
          return;
        }

        response.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  };
}

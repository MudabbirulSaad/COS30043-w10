const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        });
      } catch (error) {
        next(error);
      }
    }
  };
}

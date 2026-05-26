import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn((config) => ({ config }))
  }
}));

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe('mysql pool configuration', () => {
  it('reports missing required database environment variables clearly', async () => {
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;

    const { createPoolFromEnv } = await import('../server/mysql.js');

    expect(() => createPoolFromEnv()).toThrow(
      'Missing required database environment variable(s): DB_HOST, DB_USER, DB_PASSWORD, DB_NAME'
    );
  });

  it('defaults the database port to 3306', async () => {
    process.env.DB_HOST = 'feenix-mariadb.swin.edu.au';
    process.env.DB_USER = 's105281389';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_NAME = 's105281389_db';
    delete process.env.DB_PORT;

    const mysql = (await import('mysql2/promise')).default;
    const { createPoolFromEnv } = await import('../server/mysql.js');

    createPoolFromEnv();

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'feenix-mariadb.swin.edu.au',
        port: 3306,
        user: 's105281389',
        password: 'password',
        database: 's105281389_db'
      })
    );
  });
});

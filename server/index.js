import '@dotenvx/dotenvx/config';
import { createApp } from './app.js';
import { createPoolFromEnv } from './mysql.js';

const port = Number(process.env.APP_PORT || 3000);
const pool = createPoolFromEnv();
const app = createApp({ pool });

app.listen(port, () => {
  console.log(`Travel CRUD API listening on http://localhost:${port}`);
});

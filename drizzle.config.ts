import { defineConfig } from 'drizzle-kit';

import { envs } from './src/config/index.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/services/db/index.ts',
  out: './src/services/db/migrations',
  dbCredentials: { url: envs.db.url },
  migrations: {
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  breakpoints: true,
  verbose: true,
});

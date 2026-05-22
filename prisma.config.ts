import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { envs } from './src/config';

export default defineConfig({
  schema: "./src/services/prisma/schema",
  migrations: {
    path: "./src/services/prisma/migrations",
    seed: 'tsx src/services/prisma/seed/index.ts',
  },
  datasource: {url: envs.pg.uri},
});

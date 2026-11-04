import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';

import { envs } from '#config/index.js';

@Module({
  imports: [
    DrizzleModule.forRoot({
      drizzle,
      connection: {
        connectionString: envs.db.url,
        max: envs.db.maxPool,
        options: `-c timezone=${envs.db.timezone}`,
      },
      logger: envs.app.stage === 'dev',
    }),
  ],
})
export class DbModule {}

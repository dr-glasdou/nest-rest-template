import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { envs } from './config/index.js';
import { configureApp } from './configure-app.js';

const logger = new Logger('bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { docsPath, jsonPath } = configureApp(app);

  await app.listen(envs.app.port);
  const appUrl = process.env.PORTLESS_URL ?? (await app.getUrl());
  logger.log(`Application is running on: ${appUrl}`);
  logger.debug(`Docs available at:`);
  logger.debug(`  - ${appUrl}${docsPath}`);
  logger.debug(`  - ${appUrl}${jsonPath}`);
}
bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});

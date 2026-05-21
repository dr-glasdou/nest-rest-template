import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { ExceptionsFilter } from './filters';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });

  app.setGlobalPrefix(envs.apiPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new ExceptionsFilter());

  await app.listen(envs.port);
  const localUrl = await app.getUrl();
  const portlessUrl = process.env.PORTLESS_URL;
  logger.log(`Application is running on: ${portlessUrl ?? localUrl}`);
  if (portlessUrl) logger.log(`Local: ${localUrl}`);
}

bootstrap().catch((error) => {
  logger.error('Error during application bootstrap:', error);
  process.exit(1);
});

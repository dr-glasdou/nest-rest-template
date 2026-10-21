import type { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { constants, envs, setupDocs } from './config/index.js';
import { HttpExceptionFilter } from './filters/index.js';

/** Shared Nest wiring for bootstrap and e2e. */
export function configureApp(app: INestApplication) {
  app.enableCors({ origin: envs.app.trustedOrigins, credentials: true });
  app.enableCsrfProtection({ trustedOrigins: envs.app.trustedOrigins });
  app.setGlobalPrefix(envs.app.prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: constants.api.defaultVersion,
    prefix: constants.api.versionPrefix,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  return setupDocs(app);
}

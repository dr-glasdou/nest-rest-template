import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Request, Response } from 'express';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { constants } from './constants.config.js';
import { envs } from './envs.config.js';

export const setupDocs = (app: INestApplication) => {
  const prefix = envs.app.prefix;
  const docsPath = `/${prefix}/docs`;
  const jsonPath = `${docsPath}.json`;
  const { name, description } = constants.app;

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(
      [
        description,
        '',
        '## Versioning',
        `Routes are URI-versioned as \`/${prefix}/${constants.api.versionPrefix}{n}/...\` (default: \`v${constants.api.defaultVersion}\`).`,
        '',
        '## Docs',
        `- OpenAPI JSON: [\`${jsonPath}\`](${jsonPath})`,
      ].join('\n'),
    )
    .setVersion('1.0')
    .addServer('/', 'Current host')
    .addTag('Health', 'Liveness probes for orchestration and uptime checks')
    .addTag('User', 'User identity CRUD. Passwords are hashed; responses never include the hash. Soft-deleted rows are excluded from reads/updates.')
    .addTag('Auth', 'Session cookie auth. Sign-up/sign-in set the session; me/sign-out require it.')
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  app.use(jsonPath, (_req: Request, res: Response) => {
    res.type('application/json').send(document);
  });

  app.use(
    docsPath,
    apiReference({
      url: jsonPath,
      pageTitle: name,
      theme: 'elysiajs',
      hideModels: false,
      defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
    }),
  );

  return { docsPath, jsonPath };
};

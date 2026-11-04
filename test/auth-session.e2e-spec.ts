import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('auth session smoke', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    configureApp(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('sign-in sets a session cookie that unlocks /me and /user', async () => {
    await agent
      .post('/api/v1/auth/sign-in')
      .send({ username: 'admin', password: 'Abcd@1234' })
      .expect(201)
      .expect({ mfaRequired: false });

    const me = await agent.get('/api/v1/auth/me').expect(200);
    expect(me.body).toMatchObject({ username: 'admin' });

    const list = await agent.get('/api/v1/user').query({ page: 1, limit: 10 }).expect(200);
    expect(list.body.data[0]).toEqual(
      expect.objectContaining({
        username: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });
});

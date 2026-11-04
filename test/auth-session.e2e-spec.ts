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

  it('sign-up → create api key → /me with bearer only', async () => {
    const username = `e2e${Date.now().toString(36)}`;
    const password = 'TestPass1!';
    const fresh = request.agent(app.getHttpServer());

    await fresh
      .post('/api/v1/auth/sign-up')
      .send({ name: 'E2E User', username, password })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({ username, name: 'E2E User' });
      });

    const created = await fresh
      .post('/api/v1/auth/api-key')
      .send({ name: 'e2e-key', description: 'e2e regression' })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^[0-9a-f]{16}$/),
        key: expect.stringMatching(/^dr_[0-9a-f]{16}_[A-Za-z0-9_-]{43}$/),
        name: 'e2e-key',
      }),
    );
    expect(created.body.key).toContain(created.body.id);

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${created.body.key}`)
      .expect(200);
    expect(me.body).toMatchObject({ username });
  });
});

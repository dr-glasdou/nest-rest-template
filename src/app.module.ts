import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { envs } from '#config/index.js';

import * as modules from './modules/index.js';
import * as services from './services/index.js';

@Module({
  imports: [
    // Authentication before Authorization — global guards run in import order
    AuthenticationModule.forRoot({
      session: {
        absoluteTtl: envs.auth.session.absoluteTtl,
        idleTtl: envs.auth.session.idleTtl,
        // ponytail: Secure/__Host- only works on HTTPS; off for local HTTP (portless)
        cookie: { secure: envs.app.isProd },
        trustedOrigins: envs.app.trustedOrigins,
      },
    }),
    AuthorizationModule.forRoot(),
    ...Object.values(modules),
    ...Object.values(services),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }],
})
export class AppModule {}

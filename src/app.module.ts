import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import * as modules from './modules/index.js';
import * as services from './services/index.js';

@Module({
  imports: [...Object.values(modules), ...Object.values(services)],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }],
})
export class AppModule {}

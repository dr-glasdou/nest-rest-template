import { Module } from '@nestjs/common';

import { RbacModule } from '#modules/rbac/rbac.module.js';
import { UserModule } from '#modules/user/user.module.js';

import { ApiKeyController } from './api-key.controller.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { ApiKeyAuth, SessionAuth } from './providers/index.js';
import { DrizzleAuthStore } from './stores/index.js';

@Module({
  imports: [UserModule, RbacModule],
  providers: [SessionAuth, CredentialsService, ApiKeyAuth, DrizzleAuthStore],
  controllers: [AuthController, ApiKeyController],
})
export class AuthModule {}

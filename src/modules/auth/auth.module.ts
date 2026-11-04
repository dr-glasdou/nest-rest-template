import { Module } from '@nestjs/common';

import { UserModule } from '#modules/user/user.module.js';

import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { SessionAuth } from './providers/index.js';

@Module({
  imports: [UserModule],
  providers: [SessionAuth, CredentialsService],
  controllers: [AuthController],
})
export class AuthModule {}

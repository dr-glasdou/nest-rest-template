import { Module } from '@nestjs/common';

import { UserController } from './user.controller.js';
import { UserPolicy } from './user.policy.js';
import { UserService } from './user.service.js';

@Module({
  controllers: [UserController],
  providers: [UserService, UserPolicy],
  exports: [UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common';

import { PermissionPolicy, RolePolicy } from './policies/index.js';
import { PermissionController } from './permission.controller.js';
import { RbacController } from './rbac.controller.js';
import { RbacService } from './rbac.service.js';
import { RoleController } from './role.controller.js';

@Module({
  controllers: [RbacController, PermissionController, RoleController],
  providers: [RbacService, RolePolicy, PermissionPolicy],
  exports: [RbacService],
})
export class RbacModule {}

import { Can } from '@nestjs/authorization';
import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ParseCuidPipe, PaginationDto } from '#modules/common/index.js';

import { CreateRoleDto, PaginatedRolesDto, RoleDto } from './dto/index.js';
import { RolePolicy } from './policies/index.js';
import { RbacService } from './rbac.service.js';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  private readonly logger = new Logger(RoleController.name);

  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @Can(RolePolicy, 'read')
  @ApiOperation({ summary: 'List roles', description: 'Paginated roles with permissions. Total is capped at countCap.' })
  @ZodResponse({ status: 200, type: PaginatedRolesDto })
  findAll(@Query() query: PaginationDto) {
    return this.rbacService.listRoles(query);
  }

  @Get(':id')
  @Can(RolePolicy, 'read')
  @ApiOperation({ summary: 'Get role' })
  @ZodResponse({ status: 200, type: RoleDto })
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.rbacService.findRole(id);
  }

  @Post()
  @Can(RolePolicy, 'create')
  @ApiOperation({ summary: 'Create role' })
  @ZodResponse({ status: 201, type: RoleDto })
  create(@Body() body: CreateRoleDto) {
    this.logger.debug(`Creating role name=${body.name}`);
    return this.rbacService.createRole(body.name);
  }

  @Delete(':id')
  @Can(RolePolicy, 'delete')
  @ApiOperation({ summary: 'Delete role' })
  @ZodResponse({ status: 200, type: RoleDto })
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.rbacService.deleteRole(id);
  }

  @Post(':id/permissions/:permissionId')
  @Can(RolePolicy, 'update')
  @ApiOperation({ summary: 'Grant permission to role' })
  @ZodResponse({ status: 200, type: RoleDto })
  grantPermission(@Param('id', ParseCuidPipe) id: string, @Param('permissionId', ParseCuidPipe) permissionId: string) {
    return this.rbacService.grantPermission(id, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @Can(RolePolicy, 'update')
  @ApiOperation({ summary: 'Revoke permission from role' })
  @ZodResponse({ status: 200, type: RoleDto })
  revokePermission(@Param('id', ParseCuidPipe) id: string, @Param('permissionId', ParseCuidPipe) permissionId: string) {
    return this.rbacService.revokePermission(id, permissionId);
  }

  @Post(':id/users/:userId')
  @Can(RolePolicy, 'update')
  @ApiOperation({ summary: 'Assign role to user' })
  assignUser(@Param('id', ParseCuidPipe) id: string, @Param('userId', ParseCuidPipe) userId: string) {
    return this.rbacService.assignRole(userId, id).then(() => ({ message: 'Role assigned' }));
  }

  @Delete(':id/users/:userId')
  @Can(RolePolicy, 'update')
  @ApiOperation({ summary: 'Unassign role from user' })
  unassignUser(@Param('id', ParseCuidPipe) id: string, @Param('userId', ParseCuidPipe) userId: string) {
    return this.rbacService.unassignRole(userId, id).then(() => ({ message: 'Role unassigned' }));
  }
}

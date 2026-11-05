import { Can } from '@nestjs/authorization';
import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ParseCuidPipe, PaginationDto } from '#modules/common/index.js';

import { CreatePermissionDto, PaginatedPermissionsDto, PermissionDto } from './dto/index.js';
import { PermissionPolicy } from './policies/index.js';
import { RbacService } from './rbac.service.js';

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @Can(PermissionPolicy, 'read')
  @ApiOperation({ summary: 'List permissions', description: 'Paginated permissions. Total is capped at countCap.' })
  @ZodResponse({ status: 200, type: PaginatedPermissionsDto })
  findAll(@Query() query: PaginationDto) {
    return this.rbacService.listPermissions(query);
  }

  @Post()
  @Can(PermissionPolicy, 'create')
  @ApiOperation({ summary: 'Create permission' })
  @ZodResponse({ status: 201, type: PermissionDto })
  create(@Body() body: CreatePermissionDto) {
    this.logger.debug(`Creating permission ${body.module}:${body.action}`);
    return this.rbacService.createPermission(body.module, body.action);
  }

  @Delete(':id')
  @Can(PermissionPolicy, 'delete')
  @ApiOperation({ summary: 'Delete permission' })
  @ZodResponse({ status: 200, type: PermissionDto })
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.rbacService.deletePermission(id);
  }
}

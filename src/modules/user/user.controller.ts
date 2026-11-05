import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ParseCuidPipe, PaginationDto } from '#modules/common/index.js';

import { CreateUserDto, PaginatedUsersDto, PublicUserDto, UpdateUserDto } from './dto/index.js';
import { UserPolicy } from './user.policy.js';
import { UserService } from './user.service.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create user',
    description: 'Stores an argon2-hashed password. Response omits the password hash.',
  })
  @ZodResponse({ status: 201, type: PublicUserDto, description: 'User created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Can(UserPolicy, 'read')
  @ApiOperation({
    summary: 'List users',
    description: 'Paginated active users only (soft-deleted excluded). Total is capped at countCap.',
  })
  @ZodResponse({ status: 200, type: PaginatedUsersDto, description: 'Paginated users' })
  findAll(@Query() query: PaginationDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Can(UserPolicy, 'read')
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Returns a public user. Soft-deleted users respond 404.',
  })
  @ZodResponse({ status: 200, type: PublicUserDto, description: 'User found' })
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Can(UserPolicy, 'update')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an active user. Soft-deleted users respond 404.',
  })
  @ZodResponse({ status: 200, type: PublicUserDto, description: 'User updated' })
  update(@Param('id', ParseCuidPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Can(UserPolicy, 'delete')
  @ApiOperation({
    summary: 'Soft-delete user',
    description: 'Sets deletedAt. Already-deleted or missing users respond 404.',
  })
  @ZodResponse({ status: 200, type: PublicUserDto, description: 'User soft-deleted' })
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.userService.remove(id);
  }

  @Patch(':id/restore')
  @Can(UserPolicy, 'restore')
  @ApiOperation({
    summary: 'Restore user',
    description: 'Removes deletedAt. Active users respond 404.',
  })
  @ZodResponse({ status: 200, type: PublicUserDto, description: 'User restored' })
  restore(@Param('id', ParseCuidPipe) id: string) {
    return this.userService.restore(id);
  }
}

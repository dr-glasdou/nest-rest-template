import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { Body, Controller, Delete, Get, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { apiKeyTable, createApiKeySchema } from '#services/db/index.js';

import { CreateApiKeyDto } from './dto/index.js';
import { ApiKeyAuth, SessionAuth } from './providers/index.js';

@Authenticate({ providers: [SessionAuth] })
@Can.Anyone()
@Controller('auth/api-key')
export class ApiKeyController {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly apiKeyAuth: ApiKeyAuth,
  ) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body({ schema: createApiKeySchema }) { name, description, expiresAt }: CreateApiKeyDto) {
    const { key, id, hash } = this.apiKeyAuth.generate();
    await this.db.insert(apiKeyTable).values({
      id,
      name,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      hash,
      userId,
      createdAt: new Date(),
    });
    return { id, key, name, description, expiresAt };
  }

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.db
      .select({
        id: apiKeyTable.id,
        name: apiKeyTable.name,
        description: apiKeyTable.description,
        createdAt: apiKeyTable.createdAt,
        expiresAt: apiKeyTable.expiresAt,
      })
      .from(apiKeyTable)
      .where(eq(apiKeyTable.userId, userId));
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const revoked = await this.db
      .delete(apiKeyTable)
      .where(and(eq(apiKeyTable.id, id), eq(apiKeyTable.userId, userId)))
      .returning({ id: apiKeyTable.id });
    if (!revoked.length) throw new NotFoundException({ message: 'Api key not found', status: HttpStatus.NOT_FOUND });
    return revoked;
  }
}

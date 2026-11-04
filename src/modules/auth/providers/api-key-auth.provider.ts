import { ApiKeyProvider, AuthenticationRegistry } from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { envs } from '#config/index.js';
import { UserService } from '#modules/user/user.service.js';
import { apiKeyTable, PublicUser } from '#services/db/index.js';

@Injectable()
export class ApiKeyAuth extends ApiKeyProvider<PublicUser> {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly userService: UserService,
    registry: AuthenticationRegistry,
  ) {
    super({ prefix: envs.auth.apiKey.prefix, realm: 'store' });
    registry.registerProvider(this, { order: 2 });
  }

  async findKey(id: string) {
    const [key] = await this.db.select().from(apiKeyTable).where(eq(apiKeyTable.id, id));
    const user = key && (await this.userService.findOne(key.userId));
    return user ? { hash: key.hash, user, expiresAt: key.expiresAt } : null;
  }
}

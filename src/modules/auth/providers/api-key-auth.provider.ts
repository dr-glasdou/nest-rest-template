import { ApiKeyProvider, AuthenticationRegistry } from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { envs } from '#config/index.js';
import { MePrincipal } from '#modules/auth/dto/me.dto.js';
import { RbacService } from '#modules/rbac/index.js';
import { UserService } from '#modules/user/user.service.js';
import { apiKeyTable } from '#services/db/index.js';

@Injectable()
export class ApiKeyAuth extends ApiKeyProvider<MePrincipal> {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly userService: UserService,
    private readonly rbacService: RbacService,
    registry: AuthenticationRegistry,
  ) {
    super({ prefix: envs.auth.apiKey.prefix, realm: 'store' });
    registry.registerProvider(this, { order: 2 });
  }

  async findKey(id: string) {
    const [key] = await this.db.select().from(apiKeyTable).where(eq(apiKeyTable.id, id));
    const user = key && (await this.userService.findOne(key.userId));
    if (!user) return null;
    const authz = await this.rbacService.getAuthz(user.id);
    return { hash: key.hash, user: { ...user, ...authz }, expiresAt: key.expiresAt };
  }
}

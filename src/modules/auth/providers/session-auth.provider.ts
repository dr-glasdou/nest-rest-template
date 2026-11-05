import { AuthenticationRegistry, SessionCookieProvider, SessionRecord } from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';

import { MePrincipal } from '#modules/auth/dto/me.dto.js';
import { RbacService } from '#modules/rbac/index.js';
import { UserService } from '#modules/user/index.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<MePrincipal> {
  constructor(
    private readonly userService: UserService,
    private readonly rbacService: RbacService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  async validate(session: SessionRecord) {
    const user = await this.userService.findOne(session.userId);
    const authz = await this.rbacService.getAuthz(user.id);
    return { ...user, ...authz };
  }
}

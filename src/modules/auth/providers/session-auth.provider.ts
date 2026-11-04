import { AuthenticationRegistry, SessionCookieProvider, SessionRecord } from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';

import { UserService } from '#modules/user/index.js';
import { PublicUser } from '#services/db/index.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<PublicUser> {
  constructor(
    private readonly userService: UserService,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  validate(session: SessionRecord) {
    return this.userService.findOne(session.userId);
  }
}

import { Policy, type PolicyBefore } from '@nestjs/authorization';

import { ADMIN_ROLE, hasPermission, type AuthPrincipal } from '#modules/rbac/index.js';

@Policy()
export class UserPolicy implements PolicyBefore<AuthPrincipal> {
  before(user: AuthPrincipal | null) {
    if (user?.roles.includes(ADMIN_ROLE)) return true;
  }

  create(user: AuthPrincipal | null) {
    return hasPermission(user, 'user', 'create');
  }

  read(user: AuthPrincipal | null) {
    return hasPermission(user, 'user', 'read');
  }

  update(user: AuthPrincipal | null) {
    return hasPermission(user, 'user', 'update');
  }

  delete(user: AuthPrincipal | null) {
    return hasPermission(user, 'user', 'delete');
  }

  restore(user: AuthPrincipal | null) {
    return hasPermission(user, 'user', 'restore');
  }
}

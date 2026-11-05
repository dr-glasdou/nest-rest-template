import { Policy, type PolicyBefore } from '@nestjs/authorization';

import { ADMIN_ROLE } from '../rbac.constants.js';
import { hasPermission, type AuthPrincipal } from '../utils/auth-principal.js';

@Policy()
export class RolePolicy implements PolicyBefore<AuthPrincipal> {
  before(user: AuthPrincipal | null) {
    if (user?.roles.includes(ADMIN_ROLE)) return true;
  }

  create(user: AuthPrincipal | null) {
    return hasPermission(user, 'role', 'create');
  }

  read(user: AuthPrincipal | null) {
    return hasPermission(user, 'role', 'read');
  }

  update(user: AuthPrincipal | null) {
    return hasPermission(user, 'role', 'update');
  }

  delete(user: AuthPrincipal | null) {
    return hasPermission(user, 'role', 'delete');
  }
}

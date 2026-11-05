import { ADMIN_ROLE, RBAC_ACTIONS } from '#services/db/index.js';

/** Static product modules seeded into `permission`. Expand when a sibling API appears. */
export const SEED_MODULES = ['user', 'role', 'permission'] as const;

export const SEED_ROLES = [ADMIN_ROLE] as const;

export { ADMIN_ROLE, RBAC_ACTIONS };

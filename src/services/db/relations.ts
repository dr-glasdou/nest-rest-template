import { defineRelations } from 'drizzle-orm';

import * as tables from './tables/index.js';

export const relations = defineRelations(tables, (r) => ({
  userTable: {
    sessions: r.many.sessionTable({
      from: r.userTable.id,
      to: r.sessionTable.userId,
    }),
    apiKeys: r.many.apiKeyTable({
      from: r.userTable.id,
      to: r.apiKeyTable.userId,
    }),
    roles: r.many.roleTable({
      from: r.userTable.id.through(r.userRoleTable.userId),
      to: r.roleTable.id.through(r.userRoleTable.roleId),
    }),
  },
  sessionTable: {
    user: r.one.userTable({
      from: r.sessionTable.userId,
      to: r.userTable.id,
      optional: false,
    }),
  },
  apiKeyTable: {
    user: r.one.userTable({
      from: r.apiKeyTable.userId,
      to: r.userTable.id,
      optional: false,
    }),
  },
  roleTable: {
    permissions: r.many.permissionTable({
      from: r.roleTable.id.through(r.rolePermissionTable.roleId),
      to: r.permissionTable.id.through(r.rolePermissionTable.permissionId),
    }),
    users: r.many.userTable({
      from: r.roleTable.id.through(r.userRoleTable.roleId),
      to: r.userTable.id.through(r.userRoleTable.userId),
    }),
  },
  permissionTable: {
    roles: r.many.roleTable({
      from: r.permissionTable.id.through(r.rolePermissionTable.permissionId),
      to: r.roleTable.id.through(r.rolePermissionTable.roleId),
    }),
  },
}));

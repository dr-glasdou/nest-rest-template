import { index, primaryKey, snakeCase, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

import { cuid } from './shared.js';
import { userTable } from './auth.tables.js';

export const RBAC_ACTIONS = ['create', 'read', 'update', 'delete', 'restore'] as const;
export type RbacAction = (typeof RBAC_ACTIONS)[number];
export const ADMIN_ROLE = 'admin';

const moduleNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'Module must be snake_case letters');

export const roleTable = snakeCase.table(
  'role',
  {
    ...cuid,
    name: text().notNull(),
  },
  (t) => [uniqueIndex('role_name_uq').on(t.name)],
);

export type Role = typeof roleTable.$inferSelect;
export const roleSelectSchema = createSelectSchema(roleTable);
export const roleCreateSchema = createInsertSchema(roleTable)
  .pick({ name: true })
  .extend({
    name: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(50)
      .regex(/^[a-z][a-z0-9_]*$/, 'Role must be snake_case letters'),
  });

export const permissionTable = snakeCase.table(
  'permission',
  {
    ...cuid,
    module: text().notNull(),
    action: text().notNull(),
  },
  (t) => [uniqueIndex('permission_module_action_uq').on(t.module, t.action)],
);

export type Permission = typeof permissionTable.$inferSelect;
export const permissionSelectSchema = createSelectSchema(permissionTable);
export const permissionRefSchema = z.object({
  module: z.string(),
  action: z.string(),
});
export const permissionCreateSchema = z.object({
  module: moduleNameSchema,
  action: z.enum(RBAC_ACTIONS),
});

export const rolePermissionTable = snakeCase.table(
  'role_permission',
  {
    roleId: text()
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
    permissionId: text()
      .notNull()
      .references(() => permissionTable.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index('role_permission_permission_id_idx').on(t.permissionId),
  ],
);

export const userRoleTable = snakeCase.table(
  'user_role',
  {
    userId: text()
      .notNull()
      .references(() => userTable.id, { onDelete: 'cascade' }),
    roleId: text()
      .notNull()
      .references(() => roleTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index('user_role_role_id_idx').on(t.roleId)],
);

export const authzSchema = z.object({
  roles: z.array(z.string()),
  permissions: z.array(permissionRefSchema),
  modules: z.array(z.string()),
});
export type Authz = z.infer<typeof authzSchema>;

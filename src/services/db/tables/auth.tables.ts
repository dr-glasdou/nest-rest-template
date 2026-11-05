import { sql } from 'drizzle-orm';
import { index, jsonb, snakeCase, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { z } from 'zod';

import { at, auditableDates, cuid } from './shared.js';

export const userTable = snakeCase.table(
  'user',
  {
    ...cuid,
    name: text().notNull(),
    username: text().notNull(),
    password: text().notNull(),
    ...auditableDates,
  },
  (t) => [
    uniqueIndex('user_username_active_uq')
      .on(t.username)
      .where(sql`${t.deletedAt} is null`),
  ],
);

export type User = typeof userTable.$inferSelect;
export type PublicUser = Omit<User, 'password'>;
export const userSelectSchema = createSelectSchema(userTable);
export const userPublicSchema = userSelectSchema.omit({ password: true });

const nameSchema = z.string().trim().min(3, 'Name must be at least 3 characters').max(100);
export const userCreateBaseSchema = createInsertSchema(userTable)
  .pick({ name: true, username: true, password: true })
  .extend({
    name: nameSchema,
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username must be at least 3 characters')
      .max(30)
      .regex(/^[a-z0-9_.]+$/, 'Only letters, numbers, underscores and dots allowed'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must be at most 64 characters')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/\d/, 'Must contain a number'),
  });
export const userCreateSchema = userCreateBaseSchema.refine((d) => !d.password.toLowerCase().includes(d.username), {
  message: 'Password must not contain the username',
  path: ['password'],
});
export const userUpdateSchema = createInsertSchema(userTable).pick({ name: true }).extend({ name: nameSchema });

export const sessionTable = snakeCase.table(
  'sessions',
  {
    ...cuid,
    userId: text()
      .notNull()
      .references(() => userTable.id),
    createdAt: at().notNull(),
    expiresAt: at().notNull(),
    lastActiveAt: at().notNull(),
    mfa: text({ enum: ['pending', 'verified'] }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId), index('sessions_expires_at_idx').on(table.expiresAt)],
);

export const apiKeyTable = snakeCase.table(
  'api_key',
  {
    // ApiKeyProvider public id: 16 hex chars from generate(), not cuid
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => userTable.id),
    name: text().notNull(),
    description: text(),
    hash: text().notNull(),
    createdAt: at().notNull(),
    expiresAt: at(),
  },
  (table) => [index('api_keys_user_id_idx').on(table.userId)],
);
export const createApiKeySchema = createInsertSchema(apiKeyTable)
  .pick({ name: true, description: true, expiresAt: true })
  .extend({
    name: nameSchema,
    description: z.string().min(3).max(200).optional(),
    expiresAt: z.iso.datetime().optional(),
  });

/** One-shot flags; insert key once, unique violation = already done. */
export const SETUP_ADMIN_BOOTSTRAPPED = 'admin_bootstrapped';
export const setupTable = snakeCase.table('setup', {
  key: text().primaryKey(),
});

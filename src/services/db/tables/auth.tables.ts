import { snakeCase, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';

import { auditableDates, cuid } from './shared.js';

export const userTable = snakeCase.table('user', {
  ...cuid,
  name: text().notNull(),
  username: text().unique().notNull(),
  password: text().notNull(),
  ...auditableDates,
});
export type User = typeof userTable.$inferSelect;
export type PublicUser = Omit<User, 'password'>;
export const userSelectSchema = createSelectSchema(userTable);
export const userPublicSchema = userSelectSchema.omit({ password: true });
export const userCreateSchema = createInsertSchema(userTable).pick({ name: true, username: true, password: true });
export const userUpdateSchema = createInsertSchema(userTable).pick({ name: true });

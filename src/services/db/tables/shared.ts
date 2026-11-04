import { createId } from '@paralleldrive/cuid2';
import { text, timestamp } from 'drizzle-orm/pg-core';

export const cuid = {
  id: text()
    .primaryKey()
    .$default(() => createId()),
};

export const auditableDates = {
  createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
  deletedAt: timestamp({ withTimezone: true, mode: 'string' }),
};

/** Auth timestamps: `@nestjs/authentication` SessionStore expects `Date`. Fresh builder per column. */
export const at = () => timestamp({ withTimezone: true, mode: 'date' });

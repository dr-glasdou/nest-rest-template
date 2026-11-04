import { defineRelations } from 'drizzle-orm';

import * as tables from './tables/index.js';

export const relations = defineRelations(tables, (r) => ({
  userTable: {
    sessions: r.many.sessionTable({
      from: r.userTable.id,
      to: r.sessionTable.userId,
    }),
  },
  sessionTable: {
    user: r.one.userTable({
      from: r.sessionTable.userId,
      to: r.userTable.id,
      optional: false,
    }),
  },
}));

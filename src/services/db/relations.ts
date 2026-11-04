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
  },
  sessionTable: {
    user: r.one.userTable({
      from: r.sessionTable.userId,
      to: r.userTable.id,
      optional: false,
    }),
  },
  apiKeys: {
    user: r.one.userTable({
      from: r.apiKeyTable.userId,
      to: r.userTable.id,
      optional: false,
    }),
  },
}));

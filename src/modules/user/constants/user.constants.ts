import { userTable } from '#services/db/index.js';

export const publicUser = {
  id: userTable.id,
  name: userTable.name,
  username: userTable.username,
  createdAt: userTable.createdAt,
  updatedAt: userTable.updatedAt,
  deletedAt: userTable.deletedAt,
} as const;

import { AuthenticationStorage, SessionRecord, SessionStore } from '@nestjs/authentication';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, lt, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { withoutNulls } from '#modules/common/utils/without-null.util.js';
import { sessionTable } from '#services/db/index.js';

@Injectable()
export class DrizzleAuthStore implements SessionStore {
  private readonly logger = new Logger(DrizzleAuthStore.name);
  protected readonly maxPending: number = 10_000;

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({
      sessions: this,
    });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    this.logger.debug(`Getting session: ${id}`);
    const [row] = await this.db.select().from(sessionTable).where(eq(sessionTable.id, id));
    return row && withoutNulls(row);
  }

  async createSession(session: SessionRecord): Promise<void> {
    this.logger.debug(`Creating session: ${session.id}`);
    await this.db.insert(sessionTable).values(session);
    await this.db.delete(sessionTable).where(lte(sessionTable.expiresAt, session.createdAt));
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    this.logger.debug(`Touching session: ${id}`);
    await this.db
      .update(sessionTable)
      .set({ lastActiveAt })
      .where(and(eq(sessionTable.id, id), lt(sessionTable.lastActiveAt, lastActiveAt)));
  }

  async deleteSession(id: string): Promise<boolean> {
    this.logger.debug(`Deleting session: ${id}`);
    const deleted = await this.db.delete(sessionTable).where(eq(sessionTable.id, id)).returning({ id: sessionTable.id });
    return deleted.length > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    this.logger.debug(`Listing user sessions: ${userId}`);
    const rows = await this.db.select().from(sessionTable).where(eq(sessionTable.userId, userId));
    return rows.map(withoutNulls);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    this.logger.debug(`Deleting user sessions: ${userId}`);
    await this.db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  }
}

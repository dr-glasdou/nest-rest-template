import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';

import { constants } from '#config/index.js';
import { hasher, PaginationDto } from '#modules/common/index.js';
import { PublicUser, SETUP_ADMIN_BOOTSTRAPPED, setupTable, User, userTable } from '#services/db/index.js';

import { publicUser } from './constants/user.constants.js';
import { CreateUserDto, PaginatedUsersDto, UpdateUserDto } from './dto/index.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    this.logger.debug(`Creating user username=${dto.username}`);
    try {
      const [user] = await this.db
        .insert(userTable)
        .values({ name: dto.name, username: dto.username, password: await hasher.hash(dto.password) })
        .returning(publicUser);
      this.logger.debug(`Created user id=${user.id} username=${user.username}`);
      return user;
    } catch (err) {
      this.rethrowUsernameConflict(err);
    }
  }

  async bootstrapAdmin(dto: CreateUserDto): Promise<PublicUser> {
    this.logger.debug(`Bootstrapping admin username=${dto.username}`);
    try {
      return await this.db.transaction(async (tx) => {
        await tx.insert(setupTable).values({ key: SETUP_ADMIN_BOOTSTRAPPED });
        const [user] = await tx
          .insert(userTable)
          .values({ name: dto.name, username: dto.username, password: await hasher.hash(dto.password) })
          .returning(publicUser);
        this.logger.debug(`Bootstrapped admin id=${user.id} username=${user.username}`);
        return user;
      });
    } catch (err) {
      const cause = err instanceof Error && err.cause instanceof DatabaseError ? err.cause : err;
      if (cause instanceof DatabaseError && cause.code === '23505' && cause.constraint === 'setup_pkey') {
        throw new ConflictException('Admin already bootstrapped');
      }
      this.rethrowUsernameConflict(err);
    }
  }

  async findAll(query: PaginationDto): Promise<PaginatedUsersDto> {
    const { page, limit, offset } = query;
    const cap = constants.pagination.countCap;
    const where = isNull(userTable.deletedAt);
    this.logger.debug(`Listing users page=${page} limit=${limit}`);

    // select(publicUser) maps snake_case columns; raw json_agg does not
    const [items, countRows] = await Promise.all([
      this.db
        .select(publicUser)
        .from(userTable)
        .where(where)
        .orderBy(desc(userTable.createdAt), desc(userTable.id))
        .limit(limit)
        .offset(offset),
      this.db.execute<{ count: number }>(sql`
        SELECT count(*)::int AS count
        FROM (SELECT 1 FROM ${userTable} WHERE ${userTable.deletedAt} IS NULL LIMIT ${cap + 1}) t
      `),
    ]);

    const count = countRows.rows[0].count;
    const isCapped = count > cap;
    const total = Math.min(count, cap);
    const lastPage = Math.max(1, Math.ceil(total / limit));

    this.logger.debug(`Listed users total=${total} page=${page} returned=${items.length}`);
    return {
      data: items,
      meta: { total, isCapped, page, lastPage, hasNext: page < lastPage },
    };
  }

  async findOne(id: string): Promise<PublicUser> {
    this.logger.debug(`Finding user id=${id}`);
    const [user] = await this.db
      .select(publicUser)
      .from(userTable)
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)));
    return this.orThrow(user);
  }

  async findCredentials(username: string): Promise<User> {
    this.logger.debug(`Finding credentials username=${username}`);
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(and(eq(userTable.username, username), isNull(userTable.deletedAt)));
    return this.orThrow(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    this.logger.debug(`Updating user id=${id}`);
    const [user] = await this.db
      .update(userTable)
      .set({ name: dto.name })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning(publicUser);
    return this.orThrow(user);
  }

  async remove(id: string): Promise<PublicUser> {
    this.logger.debug(`Soft-deleting user id=${id}`);
    const [user] = await this.db
      .update(userTable)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning(publicUser);
    return this.orThrow(user);
  }

  async restore(id: string): Promise<PublicUser> {
    this.logger.debug(`Restoring user id=${id}`);
    try {
      const [user] = await this.db
        .update(userTable)
        .set({ deletedAt: null })
        .where(and(eq(userTable.id, id), isNotNull(userTable.deletedAt)))
        .returning(publicUser);
      return this.orThrow(user);
    } catch (err) {
      this.rethrowUsernameConflict(err);
    }
  }

  async updatePasswordHash(id: string, password: string): Promise<void> {
    this.logger.debug(`Updating password hash id=${id}`);
    const hashed = await hasher.hash(password);
    await this.db
      .update(userTable)
      .set({ password: hashed })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)));
  }

  private orThrow<T>(row: T | undefined): T {
    if (!row) throw new NotFoundException('User not found');
    return row;
  }

  private rethrowUsernameConflict(err: unknown): never {
    const cause = err instanceof Error && err.cause instanceof DatabaseError ? err.cause : err;
    if (cause instanceof DatabaseError && cause.code === '23505' && cause.constraint === 'user_username_active_uq') {
      throw new ConflictException('Username already exists');
    }
    throw err;
  }
}

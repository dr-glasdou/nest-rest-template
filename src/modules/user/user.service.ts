import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { constants } from '#config/index.js';
import { hasher, PaginationDto } from '#modules/common/index.js';
import { PublicUser, User, userTable } from '#services/db/index.js';

import { publicUser } from './constants/user.constants.js';
import { CreateUserDto, PaginatedUsersDto, UpdateUserDto } from './dto/index.js';

@Injectable()
export class UserService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const [user] = await this.db
      .insert(userTable)
      .values({ name: dto.name, username: dto.username, password: await hasher.hash(dto.password) })
      .returning(publicUser);
    return user;
  }

  async findAll(query: PaginationDto): Promise<PaginatedUsersDto> {
    const { page, limit, offset } = query;
    const cap = constants.pagination.countCap;

    const { rows } = await this.db.execute<{ data: PublicUser[]; count: number }>(sql`
      SELECT
        (
          SELECT coalesce(json_agg(u), '[]'::json)
          FROM (
            SELECT ${userTable.id}, ${userTable.name}, ${userTable.username},
                   ${userTable.createdAt}, ${userTable.updatedAt}, ${userTable.deletedAt}
            FROM ${userTable}
            WHERE ${userTable.deletedAt} IS NULL
            ORDER BY ${userTable.createdAt} DESC, ${userTable.id} DESC
            LIMIT ${limit} OFFSET ${offset}
          ) u
        ) AS data,
        (
          SELECT count(*)::int
          FROM (SELECT 1 FROM ${userTable} WHERE ${userTable.deletedAt} IS NULL LIMIT ${cap + 1}) t
        ) AS count
    `);

    const { data: items, count } = rows[0];
    const isCapped = count > cap;
    const total = Math.min(count, cap);
    const lastPage = Math.max(1, Math.ceil(total / limit));

    return {
      data: items,
      meta: { total, isCapped, page, lastPage, hasNext: page < lastPage },
    };
  }

  async findOne(id: string): Promise<PublicUser> {
    const [user] = await this.db
      .select(publicUser)
      .from(userTable)
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)));
    return this.orThrow(user);
  }

  async findByUsername(username: string): Promise<PublicUser> {
    const [user] = await this.db
      .select(publicUser)
      .from(userTable)
      .where(and(eq(userTable.username, username), isNull(userTable.deletedAt)));
    return this.orThrow(user);
  }

  async findCredentials(username: string): Promise<User> {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(and(eq(userTable.username, username), isNull(userTable.deletedAt)));
    return this.orThrow(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const [user] = await this.db
      .update(userTable)
      .set({ name: dto.name })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning(publicUser);
    return this.orThrow(user);
  }

  async remove(id: string): Promise<PublicUser> {
    const [user] = await this.db
      .update(userTable)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(userTable.id, id), isNull(userTable.deletedAt)))
      .returning(publicUser);
    return this.orThrow(user);
  }

  async restore(id: string): Promise<PublicUser> {
    const [user] = await this.db
      .update(userTable)
      .set({ deletedAt: null })
      .where(and(eq(userTable.id, id), isNotNull(userTable.deletedAt)))
      .returning(publicUser);
    return this.orThrow(user);
  }

  private orThrow<T>(row: T | undefined): T {
    if (!row) throw new NotFoundException('User not found');
    return row;
  }
}

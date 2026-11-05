import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';

import { constants } from '#config/index.js';
import { PaginationDto } from '#modules/common/index.js';
import {
  Authz,
  Permission,
  permissionTable,
  Role,
  rolePermissionTable,
  roleTable,
  userRoleTable,
} from '#services/db/index.js';

import { PaginatedPermissionsDto, PaginatedRolesDto } from './dto/index.js';
import { ADMIN_ROLE, RBAC_ACTIONS, SEED_MODULES, SEED_ROLES } from './rbac.constants.js';

export type RoleWithPermissions = Role & { permissions: Permission[] };

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Insert-or-omit only — never overwrites existing rows. */
  async seed() {
    this.logger.debug('Seeding RBAC');
    await this.db
      .insert(roleTable)
      .values(SEED_ROLES.map((name) => ({ name })))
      .onConflictDoNothing({ target: roleTable.name });

    const permissions = SEED_MODULES.flatMap((module) => RBAC_ACTIONS.map((action) => ({ module, action })));
    await this.db
      .insert(permissionTable)
      .values(permissions)
      .onConflictDoNothing({ target: [permissionTable.module, permissionTable.action] });
    this.logger.debug(`Seeded roles=${SEED_ROLES.length} permissions=${permissions.length}`);
  }

  async getAuthz(userId: string): Promise<Authz> {
    const roleRows = await this.db
      .select({ name: roleTable.name })
      .from(userRoleTable)
      .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
      .where(eq(userRoleTable.userId, userId));

    const roles = [...new Set(roleRows.map((r) => r.name))];
    if (roles.includes(ADMIN_ROLE)) {
      const all = await this.db.select({ module: permissionTable.module, action: permissionTable.action }).from(permissionTable);
      return { roles, permissions: all, modules: uniqueModules(all) };
    }

    const permRows = await this.db
      .select({ module: permissionTable.module, action: permissionTable.action })
      .from(userRoleTable)
      .innerJoin(rolePermissionTable, eq(userRoleTable.roleId, rolePermissionTable.roleId))
      .innerJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
      .where(eq(userRoleTable.userId, userId));

    const permissions = uniquePermissions(permRows);
    return { roles, permissions, modules: uniqueModules(permissions) };
  }

  async listPermissions(query: PaginationDto): Promise<PaginatedPermissionsDto> {
    const { page, limit, offset } = query;
    const cap = constants.pagination.countCap;
    this.logger.debug(`Listing permissions page=${page} limit=${limit}`);

    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(permissionTable)
        .orderBy(asc(permissionTable.module), asc(permissionTable.action))
        .limit(limit)
        .offset(offset),
      this.db.execute<{ count: number }>(sql`
        SELECT count(*)::int AS count
        FROM (SELECT 1 FROM ${permissionTable} LIMIT ${cap + 1}) t
      `),
    ]);

    const count = countRows.rows[0].count;
    const isCapped = count > cap;
    const total = Math.min(count, cap);
    const lastPage = Math.max(1, Math.ceil(total / limit));

    this.logger.debug(`Listed permissions total=${total} page=${page} returned=${items.length}`);
    return {
      data: items,
      meta: { total, isCapped, page, lastPage, hasNext: page < lastPage },
    };
  }

  async createPermission(module: string, action: string) {
    try {
      const [row] = await this.db.insert(permissionTable).values({ module, action }).returning();
      return row;
    } catch (err) {
      this.rethrowUnique(err, 'Permission already exists');
    }
  }

  async deletePermission(id: string) {
    const [row] = await this.db.delete(permissionTable).where(eq(permissionTable.id, id)).returning();
    if (!row) throw new NotFoundException('Permission not found');
    return row;
  }

  async listRoles(query: PaginationDto): Promise<PaginatedRolesDto> {
    const { page, limit, offset } = query;
    const cap = constants.pagination.countCap;
    this.logger.debug(`Listing roles page=${page} limit=${limit}`);

    const [roles, countRows] = await Promise.all([
      this.db.select().from(roleTable).orderBy(asc(roleTable.name)).limit(limit).offset(offset),
      this.db.execute<{ count: number }>(sql`
        SELECT count(*)::int AS count
        FROM (SELECT 1 FROM ${roleTable} LIMIT ${cap + 1}) t
      `),
    ]);

    const count = countRows.rows[0].count;
    const isCapped = count > cap;
    const total = Math.min(count, cap);
    const lastPage = Math.max(1, Math.ceil(total / limit));
    const meta = { total, isCapped, page, lastPage, hasNext: page < lastPage };

    if (!roles.length) {
      this.logger.debug(`Listed roles total=${total} page=${page} returned=0`);
      return { data: [], meta };
    }

    const rows = await this.db
      .select({
        id: roleTable.id,
        name: roleTable.name,
        permissionId: permissionTable.id,
        module: permissionTable.module,
        action: permissionTable.action,
      })
      .from(roleTable)
      .leftJoin(rolePermissionTable, eq(roleTable.id, rolePermissionTable.roleId))
      .leftJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
      .where(inArray(roleTable.id, roles.map((r) => r.id)));

    const byId = new Map(foldRoles(rows).map((r) => [r.id, r]));
    const data = roles.map((r) => byId.get(r.id) ?? { ...r, permissions: [] });

    this.logger.debug(`Listed roles total=${total} page=${page} returned=${data.length}`);
    return { data, meta };
  }

  async findRole(id: string): Promise<RoleWithPermissions> {
    const rows = await this.db
      .select({
        id: roleTable.id,
        name: roleTable.name,
        permissionId: permissionTable.id,
        module: permissionTable.module,
        action: permissionTable.action,
      })
      .from(roleTable)
      .leftJoin(rolePermissionTable, eq(roleTable.id, rolePermissionTable.roleId))
      .leftJoin(permissionTable, eq(rolePermissionTable.permissionId, permissionTable.id))
      .where(eq(roleTable.id, id));

    const [role] = foldRoles(rows);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async createRole(name: string) {
    try {
      const [row] = await this.db.insert(roleTable).values({ name }).returning();
      return { ...row, permissions: [] as Permission[] };
    } catch (err) {
      this.rethrowUnique(err, 'Role already exists');
    }
  }

  async deleteRole(id: string) {
    const [existing] = await this.db.select().from(roleTable).where(eq(roleTable.id, id));
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.name === ADMIN_ROLE) throw new ConflictException('Cannot delete admin role');
    const [row] = await this.db.delete(roleTable).where(eq(roleTable.id, id)).returning();
    return { ...row, permissions: [] as Permission[] };
  }

  async grantPermission(roleId: string, permissionId: string) {
    await this.requireRole(roleId);
    await this.requirePermission(permissionId);
    await this.db.insert(rolePermissionTable).values({ roleId, permissionId }).onConflictDoNothing();
    return this.findRole(roleId);
  }

  async revokePermission(roleId: string, permissionId: string) {
    const deleted = await this.db
      .delete(rolePermissionTable)
      .where(and(eq(rolePermissionTable.roleId, roleId), eq(rolePermissionTable.permissionId, permissionId)))
      .returning();
    if (!deleted.length) throw new NotFoundException('Role permission not found');
    return this.findRole(roleId);
  }

  async assignRole(userId: string, roleId: string) {
    await this.requireRole(roleId);
    await this.db.insert(userRoleTable).values({ userId, roleId }).onConflictDoNothing();
  }

  async assignRoleByName(userId: string, name: string) {
    const [role] = await this.db.select().from(roleTable).where(eq(roleTable.name, name));
    if (!role) throw new NotFoundException(`Role '${name}' not found`);
    await this.db.insert(userRoleTable).values({ userId, roleId: role.id }).onConflictDoNothing();
  }

  async unassignRole(userId: string, roleId: string) {
    const deleted = await this.db
      .delete(userRoleTable)
      .where(and(eq(userRoleTable.userId, userId), eq(userRoleTable.roleId, roleId)))
      .returning();
    if (!deleted.length) throw new NotFoundException('User role not found');
  }

  private async requireRole(id: string) {
    const [row] = await this.db.select({ id: roleTable.id }).from(roleTable).where(eq(roleTable.id, id));
    if (!row) throw new NotFoundException('Role not found');
  }

  private async requirePermission(id: string) {
    const [row] = await this.db.select({ id: permissionTable.id }).from(permissionTable).where(eq(permissionTable.id, id));
    if (!row) throw new NotFoundException('Permission not found');
  }

  private rethrowUnique(err: unknown, message: string): never {
    const cause = err instanceof Error && err.cause instanceof DatabaseError ? err.cause : err;
    if (cause instanceof DatabaseError && cause.code === '23505') throw new ConflictException(message);
    throw err;
  }
}

function uniquePermissions(rows: { module: string; action: string }[]) {
  const seen = new Set<string>();
  const out: { module: string; action: string }[] = [];
  for (const row of rows) {
    const key = `${row.module}:${row.action}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

function uniqueModules(permissions: { module: string }[]) {
  return [...new Set(permissions.map((p) => p.module))];
}

function foldRoles(
  rows: {
    id: string;
    name: string;
    permissionId: string | null;
    module: string | null;
    action: string | null;
  }[],
): RoleWithPermissions[] {
  const map = new Map<string, RoleWithPermissions>();
  for (const row of rows) {
    let role = map.get(row.id);
    if (!role) {
      role = { id: row.id, name: row.name, permissions: [] };
      map.set(row.id, role);
    }
    if (row.permissionId && row.module && row.action) {
      role.permissions.push({ id: row.permissionId, module: row.module, action: row.action });
    }
  }
  return [...map.values()];
}

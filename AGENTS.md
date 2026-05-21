# rest — NestJS REST API Template

## Quick commands
```bash
pnpm run start:dev      # dev w/ hot reload (via portless)
pnpm run build           # nest build (SWC + typeCheck)
pnpm run lint            # biome check --write . (NOT eslint/prettier)
pnpm run test            # jest (ts-jest)
pnpm run test:e2e        # jest --config ./test/jest-e2e.json
pnpm run prisma:studio   # prisma studio --browser none
```

## Stack & config
- **NestJS 11**, **TypeScript 6**, **pnpm** (single package, pnpm-workspace for config only)
- **PostgreSQL** via **Prisma 7.8** with `@prisma/adapter-pg` (native Pool, not Prisma default)
- **Redis** via ioredis for JWT blacklisting
- Auth: **dual-mode** — iron-session (cookie) OR JWT (Bearer), `@Auth()` decorator → `UnifiedAuthGuard`
- Biome replaces ESLint + Prettier. Config: `biome.json` (ignores `**/generated/**`, `**/*.prisma`, `coverage/`)
- Git hooks via Lefthook: pre-commit runs `biome check` + `tsc --noEmit --skipLibCheck`, commit-msg runs `commitlint`
- Commits must follow Conventional Commits (`feat:`, `fix:`, etc.)
- SWC builder with `typeCheck: true` in `nest-cli.json`

## Prisma quirks
- Custom prisma config: `prisma.config.ts` (not `prisma/schema.prisma` by itself)
  - Schema dir: `./src/prisma/schema/`
  - Migrations dir: `./src/prisma/migrations/`
  - Output dir: `./src/prisma/generated/` (gitignored, generated files)
  - Seed command: `tsx src/prisma/seed/index.ts` (runs via `prisma.config.ts` `migrations.seed`)
- Run migrations: `npx prisma migrate deploy` (not a pnpm script — uses `prisma.config.ts`)
- Generate client after schema change: `npx prisma generate`
- Path alias `prisma` → `./src/prisma/generated` in tsconfig.json `paths`
  - Import as `import { PrismaClient } from 'prisma/client'`
- PrismaService (`src/prisma/prisma.service.ts`) uses `@prisma/adapter-pg` for native pool, logs `['info', 'warn', 'error']`

## API conventions
- Global prefix: `/api`
- URI versioning: `v1` (default), e.g. `GET /api/v1/health`
- CORS: origin `true` (allow all), credentials enabled
- Validation pipe: whitelist + forbidNonWhitelisted
- Global exception filter (`ExceptionsFilter`) — unifies HTTP error shape, handles validation errors separately
- DTOs use class-validator + class-transformer (via ValidationPipe)
- IDs use **CUID2** (`@paralleldrive/cuid2`), not UUID

## Import patterns
- `src/services.ts` aggregates infrastructure modules: `PrismaModule`, `RedisModule`
- `src/modules/index.ts` exports feature module *classes only*: `AuthModule`, `HealthModule`, `UserModule`
- `src/modules/public.ts` exports feature module *internals* (controllers, services, decorators — not module classes)
- SessionMiddleware imported from `src/modules/public`

## Architecture
```
src/
├── main.ts               # Entrypoint — bootstrap, global pipes/filters/cors/versioning
├── app.module.ts          # Root module
├── config/                # envs (Joi-validated), jwt, session, redis config
├── exceptions/            # Custom exception class
├── filters/               # Global exception filter
├── modules/
│   ├── public.ts          # Barrel: auth/health/user internals (controllers, services, decorators)
│   ├── index.ts           # Barrel: AuthModule, HealthModule, UserModule (classes only)
│   ├── auth/              # @Auth() decorator, UnifiedAuthGuard, Local/JWT strategies, iron-session + JWT auth
│   ├── user/              # CRUD + soft-delete (deletedAt), paginated findAll, password validation
│   ├── health/            # GET /api/v1/health endpoint
│   └── common/            # PaginationDto, IsCuid decorator, ExceptionHandler helper, ObjectManipulator, string util
├── prisma/
│   ├── schema/            # .prisma schema files (schema.prisma imports user.prisma via model User)
│   ├── migrations/        # Prisma migration files
│   ├── seed/              # Seed script (tsx)
│   ├── generated/         # Auto-generated Prisma client (gitignored)
│   ├── prisma.module.ts   # Global PrismaModule
│   └── prisma.service.ts  # PrismaService (adapter-pg, native pool)
├── redis/                 # Global RedisModule — JWT blacklist (moved from modules/redis)
├── services.ts            # Barrel: PrismaModule, RedisModule
```

## Testing gotchas
- `rootDir: 'src'` in jest config — test files must be in `src/` with `*.spec.ts` pattern
- No e2e tests exist yet (jest-e2e.json referenced in package.json but no `test/` dir)
- Custom `ExceptionHandler` helper (not NestJS built-in) re-throws HttpExceptions or wraps in InternalServerErrorException
- `UserService.validatePassword` fetches user with password, then strips it via `ObjectManipulator.exclude`

## Secrets & env
- `SESSION_SECRET` and `JWT_SECRET` must be ≥32 chars (Joi-enforced)
- `PG_URI` uses a single connection string (password must be URL-encoded in the value)
- `.env` is gitignored, `.env.example` is the reference
- Docker compose uses `.env` file for both PostgreSQL and Redis vars (PG_USER/PG_PASSWORD/PG_DB, REDIS_HOST/REDIS_PASSWORD)

## Important patterns
- `@Global()` modules: PrismaModule, RedisModule — available everywhere without imports
- Services throw HTTP exceptions directly (caught by global filter), use `ExceptionHandler.handle()` for unexpected errors
- Auth uses `@Auth()` decorator (wraps `UseGuards(UnifiedAuthGuard)`), supports session OR JWT transparently
- Soft delete on User via `deletedAt: DateTime?` — queries do NOT filter by default, service `remove()` sets `deletedAt`
- `portless` wraps nest start in dev (cloud tunnel) — relevant for `start:dev`/`start:debug`/`start` commands

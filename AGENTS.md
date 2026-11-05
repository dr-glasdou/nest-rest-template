# Repository Guidelines

## Project Overview

DRI identity/auth API: session cookies + API keys, user CRUD, argon2 passwords, soft-delete. NestJS 12 + Bun + Drizzle/Postgres + Zod/`nestjs-zod` + Scalar. RBAC enrichment of `/auth/me` is not implemented — don't invent `/me/roles` etc. yet.

## Architecture & Data Flow

- Layers: `src/modules/*` (HTTP/domain) · `src/services/db` (Postgres) · `src/config` · `src/filters`
- Auth via `@nestjs/authentication`: `SessionAuth` / `ApiKeyAuth` providers + `DrizzleAuthStore` (`SessionStore`). Register providers/storage; don't add a parallel auth path
- Default: auth required. Opt out with `@Public()`. Scope providers with `@Authenticate(...)`. Principal via `@CurrentUser()`
- Zod schemas live next to Drizzle tables → `createZodDto`. Global `ZodValidationPipe` + `ZodSerializerInterceptor` / `@ZodResponse`
- Typical flow: Controller → Service → `@InjectDrizzle()`. Exception: `ApiKeyController` talks to DB directly — don't spread that pattern
- Errors: Nest HTTP exceptions → `HttpExceptionFilter` → `{ status, message, errors, traceId, ... }` (`src/filters/`)
- New Nest modules: export `*Module` only from `src/modules/index.ts` (and services from `src/services/index.ts`); AppModule spreads `Object.values(...)`

## Key Directories

- `src/modules/auth` — credentials, session/API-key providers, store, controllers
- `src/modules/user` — user CRUD; exports `UserService`
- `src/modules/common` — `hasher`, pagination DTOs, `ParseCuidPipe`, omit helpers
- `src/modules/health` — liveness
- `src/services/db` — tables, relations, migrations, `DbModule`
- Prefer `#modules/...`, `#services/...`, `#config/...` (see `package.json` `imports`); ESM `.js` suffixes

## Development Commands

Prefer `make <target>` or matching `bun run` scripts — see `Makefile` / `package.json`. Never invent npm/yarn/pnpm.

- Dev: `make dev` · portless: `make portless` (`auth.dri`) · build/prod: `make build` / `make prod`
- Lint/format: `make lint` (oxlint) / `make format` (oxfmt)
- DB (Make only): `db-generate` / `db-migrate` / `db-push` / `db-studio` / `db-check`
- Ask before `make setup` (deletes `node_modules` + `bun.lock`)

## Code Conventions & Common Patterns

- Nest file names: `*.module.ts` / `*.controller.ts` / `*.service.ts` / `*.provider.ts` / `*.dto.ts`
- Barrels: `src/modules/index.ts` exports each `*.module` only. Each feature `src/modules/<feature>/index.ts` re-exports that module’s public API **except** the `.module` — avoids circular imports / Nest DI breakage. Import cross-feature symbols from `#modules/<feature>` (or sub-barrels), never from another feature’s `.module` file via its feature index
- Drizzle `*Table`; Zod `*Schema` + DTO classes; IDs: cuid2 (API-key ids from provider)
- Passwords only via `hasher` (argon2); public responses omit hash (`userPublicSchema` / column maps)
- Soft-delete users (`deletedAt`); unique username among active rows; PG `23505` → `ConflictException`
- `private readonly logger = new Logger(Class.name)` — debug happy path, warn/error failures
- Controllers may return promises directly; keep services async

## Important Files

- Bootstrap: `src/main.ts`, `src/configure-app.ts` (CORS, CSRF, `/api` + URI `v1`, Scalar), `src/app.module.ts`
- Env: `.env.example` → Zod-parsed `src/config/envs.config.ts` — ask for secrets; don't invent values
- DB entry: `drizzle.config.ts`, `src/services/db/index.ts`
- API surface: `/api/docs`, `/api/docs.json`; routes under `/api/v1/...`

## Runtime/Tooling Preferences

- Install/scripts: **Bun** (`packageManager bun@1.4.2`, `engines.bun >=1.2.0`). Prod process: **Node** (`node dist/main`)
- Build: Nest + SWC + typeCheck (`nest-cli.json`, `.swcrc`). TS: `nodenext`, strict
- Lint/format: oxlint (type-aware, `no-floating-promises: error`) and oxfmt only — not ESLint/Prettier. Print width 150

## Testing & QA

- Vitest; unit `*.spec.ts` (none yet), e2e `*.e2e-spec.ts`. Env stubs: `test/setup-env.ts`
- `make test` / `make test-e2e` (or `bun run test` / `test:e2e`)
- E2e pattern: real `NestFactory.create(AppModule)` + `configureApp` + supertest agent — match `test/auth-session.e2e-spec.ts`
- No coverage thresholds. Yaak interactive API tests: log under `docs/api/logs/` (redact secrets). `.agents/` is gitignored — restore from `skills-lock.json`, don't commit

## MCPs

• **Context7 MCP** — Fetch current docs for libraries, frameworks, SDKs, APIs, CLIs, and cloud services before coding (covers syntax, config, migration, debugging, setup, CLI usage). Use `resolve-library-id` → `query-docs` flow. Skip for refactoring, new scripts, business logic debugging, code review, and general concepts.

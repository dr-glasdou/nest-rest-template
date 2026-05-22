# NestJS REST API Template

NestJS REST API with PostgreSQL (Prisma), Redis (JWT blacklist), and dual-mode auth (iron-session + JWT).

## Quick Start

```bash
# 1. Clone & install
make install

# 2. Copy env and edit
cp .env.example .env

# 3. Start PostgreSQL + Redis
make docker-run

# 4. Run migrations
make db-migrate

# 5. Seed (optional)
make db-seed

# 6. Start dev server
make dev
# or with portless tunnel
make portless
```

### Or with make command

```bash
# 1. Initialize (install, copy env, start docker, run migrations, seed)
make init

# 2. Start dev server
make dev
# or with portless tunnel
make portless
```

> Server runs at: `http://localhost:4000/api/v1/health`

> Or with `make portless`: `https://nest-rest.glasdou.localhost/api/v1/health`

## Env vars

See `.env.example` for all required vars. Key ones: `SESSION_SECRET` and `JWT_SECRET` must be ≥32 chars.

## Portless (tunnel)

Portless replaces port number with named subdomain of localhost.
Official docs: [portless.sh](https://portless.sh/)

Configuration in `package.json`:
```json
"portless": {
  "name": "nest-rest.glasdou"
}
```

## Stack

- [NestJS 11](https://nestjs.com)
- [TypeScript 6](https://www.typescriptlang.org)
- [Prisma 7.8 (adapter-pg)](https://www.prisma.io)
- [PostgreSQL 17](https://www.postgresql.org)
- [Redis 7](https://redis.io)
- [Biome](https://biomejs.dev)
- [Lefthook](https://github.com/evilmartians/lefthook)
- [Commitlint](https://commitlint.js.org)

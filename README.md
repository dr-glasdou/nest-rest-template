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
```

Server runs at `http://localhost:4000/api/v1/health`.

## Env vars

See `.env.example` for all required vars. Key ones: `SESSION_SECRET` and `JWT_SECRET` must be ≥32 chars.

## Scripts

| Command | Action |
|---------|--------|
| `make dev` | Dev server (hot reload) |
| `make debug` | Dev server (debug mode) |
| `make prod` | Production mode |
| `make install` | Install dependencies |
| `make setup` | Clean reinstall + prisma generate |
| `make lint` | Lint & auto-fix (biome check --write) |
| `make lint-check` | Check lint (read-only) |
| `make format` | Format code (biome format --write) |
| `make format-check` | Check format (read-only) |
| `make lint-fix` | Lint + format in one pass |
| `make docker-run` | Start PostgreSQL + Redis |
| `make docker-run-prod` | Start full stack (app + db + redis) |
| `make docker-stop` | Stop all containers |
| `make docker-clean` | Destroy containers + volumes |
| `make docker-logs` | Follow infra logs |
| `make db-migrate` | Run migrations |
| `make db-seed` | Seed database |
| `make db-setup` | Migrate + seed |

Underlying pnpm scripts: `pnpm run build`, `pnpm run lint`, `pnpm run lint:fix`, `pnpm run format`, `pnpm run test`, `pnpm run test:e2e`, `pnpm run prisma:studio`.

## Stack

- NestJS 11
- TypeScript 6
- Prisma 7.8 (adapter-pg)
- PostgreSQL 17
- Redis 7
- Biome
- Lefthook
- Commitlint.

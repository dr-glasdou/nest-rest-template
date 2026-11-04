# auth

NestJS identity API (Bun + Drizzle + Zod + Scalar).

```bash
bun install            # install deps
cp .env.example .env   # local env (see file for vars)
bun run start:dev      # watch mode
# or: make dev
```

```bash
make build && make prod   # build + run production
make lint && make format  # lint + format
make test && make test-e2e
```

API reference (after start): `/api/docs` · OpenAPI JSON: `/api/docs.json`

Users: argon2-hashed passwords, public responses omit the hash, soft-delete via `DELETE /user/:id` (reads/updates skip deleted rows).

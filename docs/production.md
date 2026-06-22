# Production Runbook

This template is production-ready when these pieces are all in place:

- Pier-managed `web`, `admin`, `api`, and `internal` apps are deployed.
- A production Postgres binding is provisioned and reachable by the API.
- Drizzle migrations have run against production before the app deploys.
- A production `zero-cache` is deployed separately and exposed at a stable HTTPS URL.
- `PUBLIC_ZERO_CACHE_URL` is set from that Zero URL during deploy.
- The production smoke check passes after deploy.

## Required CI Values

GitHub Actions needs:

```text
secret: PIER_API_KEY
secret: DATABASE_URL
variable: PIER_ORGANIZATION_ID
variable: PIER_ZERO_CACHE_URL
```

Pier cloud env remains the source of truth for app runtime values and deploy
variables. The `DATABASE_URL` secret is only used by the migration step until
Pier exposes a binding-backed migration command for consumer projects.

`PIER_ZERO_CACHE_URL` must be the public HTTPS origin of the production
`zero-cache` view-syncer, for example `https://zero.example.com`.

## Deploy Order

The deploy workflow runs in this order:

1. Install dependencies.
2. Generate Pier env types.
3. Run lint, typecheck, and tests.
4. Run Drizzle migrations against the production database.
5. Deploy all Pier apps with `PIER_ZERO_CACHE_URL` passed to Pier as the Zero URL.
6. Smoke the public web, admin, API, counter read, and Zero keepalive endpoints.

Run the same flow locally with:

```sh
bun install
bun run env:types
bun run check
DATABASE_URL=<production database url> bun run db:migrate
PIER_ZERO_CACHE_URL=https://zero.example.com bun run deploy
SMOKE_ZERO_URL=https://zero.example.com bun run smoke:prod
```

## Zero Cache

Pier deploys this repo's Worker and TanStack apps. `zero-cache` is a separate
runtime and must be deployed before the web app can connect in production.

Use the same core settings as local dev:

```text
ZERO_APP_ID=pier_demo_prod
ZERO_APP_PUBLICATIONS=pier_demo_sync
ZERO_UPSTREAM_DB=<direct production postgres url>
ZERO_CVR_DB=<pooled production postgres url>
ZERO_CHANGE_DB=<pooled production postgres url>
ZERO_QUERY_URL=https://api.pier-demo.buildwithharbor.com/zero/query
ZERO_MUTATE_URL=https://api.pier-demo.buildwithharbor.com/zero/mutate
ZERO_QUERY_FORWARD_COOKIES=true
ZERO_MUTATE_FORWARD_COOKIES=true
ZERO_QUERY_ALLOWED_CLIENT_HEADERS=authorization
ZERO_MUTATE_ALLOWED_CLIENT_HEADERS=authorization
ZERO_ENABLE_CRUD_MUTATIONS=false
```

`ZERO_UPSTREAM_DB` must be a direct Postgres connection that supports logical
replication. `ZERO_CVR_DB` and `ZERO_CHANGE_DB` can use pooled connections.

The current Pier Sync integration uses short-lived Zero auth tokens and also
forwards Better Auth cookies to `/zero/query` and `/zero/mutate`. If Zero rejects
auth, those endpoints should return `401` or `403` so clients reconnect through
the normal auth refresh path.

## Database

The template uses the Pier-managed Postgres binding declared in
`platform.config.ts`. Keep schema changes in `apps/api/drizzle` and run them
with:

```sh
DATABASE_URL=<production database url> bun run db:migrate
```

The migration command also ensures:

- the global `counter_state` row exists
- the `pier_demo_sync` publication includes the `counter_state` and `user`
  tables that Zero replicates

Do not add manual table creation or dotenv fallbacks. Use Pier cloud env
whenever Pier can provide the value. Required app runtime values come from Pier
cloud env and generated `.pier` helpers; the migration job gets only the direct
production database URL because it runs outside the Worker binding runtime.

## Smoke Checks

Production smoke defaults to the Pier template domains:

```sh
SMOKE_ZERO_URL=https://zero.example.com bun run smoke:prod
```

Override URLs when testing previews or custom domains:

```sh
SMOKE_WEB_URL=https://app.example.com \
SMOKE_ADMIN_URL=https://admin.example.com \
SMOKE_API_URL=https://api.example.com \
SMOKE_ZERO_URL=https://zero.example.com \
bun run smoke:prod
```

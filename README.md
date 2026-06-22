# Pier Demo

This repo is the product-template app for Pier. It demonstrates a small
counter product deployed through Pier with separate public and admin
TanStack Start apps.

## Apps

```text
apps/web       Public/user TanStack Start app
apps/admin     Admin TanStack Start app
apps/api       API Worker with Better Auth, Postgres, KV, internal service binding, and rate-limit binding
apps/internal  Internal Worker RPC service
```

The counter is global. Signed-in users read it through Pier Sync and increment
through a Pier Sync mutation with a `5x` multiplier. Postgres stores the live
counter row that Zero syncs plus the increment history. The API Worker checks
the native Cloudflare rate-limit binding before every increment.

## API Surfaces

The demo uses Pier's split client surface instead of a catch-all API wrapper:

```ts
import { endpointClient, rpcClient, syncClient } from "./api";
```

- `syncClient.account.me.useQuery()` reads the signed-in profile from Pier Sync.
- `syncClient.counter.current.useQuery()` reads the live counter from Pier Sync.
- `syncClient.counter.increment.useMutation()` increments through Pier Sync.
- `rpcClient.agent.context.useQuery()` demonstrates a one-shot RPC query.
- `endpointClient.system.status.json()` demonstrates a normal typed HTTP
  endpoint.

Use Pier Sync for live app data and app-local mutations that should flow
through the sync engine. Use RPC for privileged reads or one-shot server work.
Use endpoints for HTTP-shaped routes such as health checks, downloads, and
webhooks.

## Auth

The API mounts Better Auth at `/auth/*` through Pier's API Worker wrapper.
Auth is email/password only. Admin access uses the Better Auth admin plugin;
there is intentionally no first-admin bootstrap helper in this template.

Auth: Better Auth uses Cloudflare KV secondary storage through Pier Auth, so
session and verification lookups can use the app's `CACHE` binding instead of
turning every auth read into a Postgres-only hot path.

## Pier

The app declares its topology in `platform.config.ts`:

- `web` and `admin` are TanStack Start apps.
- `api` owns Postgres, KV, the internal service binding, and the native
  `RATE_LIMITER` binding.
- `internal` is an internal Worker service.
- `zero-cache` is a separate runtime. Deploy it before production web traffic
  and pass its public URL as `PIER_ZERO_CACHE_URL`.

Generated `.pier` modules are the source of truth for runtime env and API
context. Regenerate them after config changes:

```sh
bun run env:types
```

Required values such as `BETTER_AUTH_SECRET` live in Pier cloud env. The
Postgres binding is provisioned and injected by Pier during deploy. Do not use
local dotenv files for normal development or deploys; the Pier CLI resolves
cloud env from `platform.config.ts` and the Pier project context.

Production deployment details live in [docs/production.md](docs/production.md).

## First Run

Use the hosted Pier API unless you are deliberately testing the control plane
locally.

```sh
pier login
pier project create
pier package install
pier env types
bun run check
DATABASE_URL=<production database url> bun run db:migrate
PIER_ZERO_CACHE_URL=https://zero.example.com bun run deploy
SMOKE_ZERO_URL=https://zero.example.com bun run smoke:prod
```

Create one CI key for GitHub Actions:

```sh
pier auth service-key create-preset github-project-ci \
  --organization-id <org-id> \
  --repo <owner/pier-demo> \
  --project pier-demo \
  --env prod
```

Store the returned key as one GitHub secret named `PIER_API_KEY`, and store the
production migration connection string as a GitHub secret named `DATABASE_URL`.
Store the non-secret organization ID as one GitHub Actions variable named
`PIER_ORGANIZATION_ID`, and store the production Zero URL as one GitHub Actions
variable named `PIER_ZERO_CACHE_URL`. The workflows install the Pier CLI and
private Pier packages from the Pier registry, generate env types, run checks,
run migrations, deploy with Pier cloud env, and smoke production.

## Development

Use the repo `dev.json` for the normal local session:

```sh
bun run dev
```

For focused local runtime work, use the `dev` CLI against the running session:

```sh
dev status --cwd /Users/dawson/projects/waypoint-guest-app
dev restart web --cwd /Users/dawson/projects/waypoint-guest-app
dev restart api --cwd /Users/dawson/projects/waypoint-guest-app
```

Local logs:

```sh
dev logs api --cwd /Users/dawson/projects/waypoint-guest-app --tail 80
dev logs zero --cwd /Users/dawson/projects/waypoint-guest-app --tail 80
pier logs --state local --project pier-demo
pier logs dump --state local --project pier-demo --markdown
```

## Checks

```sh
bun run check-types
bun run test
bun run smoke:prod
pier inspect --json
pier plan
```

This repo is not the Pier control plane. Domains, previews, backups,
billing, Cloudflare account operations, organization RBAC, and platform
telemetry belong in `/Users/dawson/projects/hosting-platform`.

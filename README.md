# Pier Guest App

This repo is the product-template app for Pier. It demonstrates a small
counter product deployed through Pier with separate public and admin
TanStack Start apps.

## Apps

```text
apps/web       Public/user TanStack Start app
apps/admin     Admin TanStack Start app
apps/api       API Worker with Better Auth, Postgres, KV, internal service binding, and Durable Object binding
apps/internal  Internal Worker RPC service
```

The counter is global. Public users can read and increment it by `1`.
Signed-in users increment through the same API mutation with a `5x` multiplier.
The API Worker uses `RateLimiterObject` to rate-limit counter mutations before
writing to D1.

## Auth

The API mounts Better Auth at `/auth/*` through Pier's API Worker wrapper.
Auth is email/password only. Admin access uses the Better Auth admin plugin;
there is intentionally no first-admin bootstrap helper in this template.

## Pier

The app declares its topology in `platform.config.ts`:

- `web` and `admin` are TanStack Start apps.
- `api` owns Postgres, KV, the internal service binding, and the `RATE_LIMITER`
  Durable Object namespace.
- `internal` is an internal Worker service.

Generated `.pier` modules are the source of truth for runtime env and API
context. Regenerate them after config changes:

```sh
bun run env:types
```

Required values such as `DATABASE_URL` and `BETTER_AUTH_SECRET` live in Pier
cloud env. Do not use local dotenv files for normal development or deploys; the
Pier CLI resolves cloud env from `platform.config.ts` and the active Pier
project context.

## First Run

Use the hosted Pier API unless you are deliberately testing the control plane
locally.

```sh
pier login
pier org select <organization-id>
pier project create
pier package install
pier env upload .env.production --env prod --app api
pier env types
bun run check
pier deploy all --env prod
```

For CI, set one secret named `PIER_API_KEY` and one repository variable named
`PIER_ORGANIZATION_ID`. The workflow installs `@buildwithharbor/pier@latest`,
uses the Pier package registry through that key, generates env types, checks the
repo, and deploys with cloud env.

## Development

```sh
bun run dev
bun run dev:web
bun run dev:admin
bun run dev:api
bun run dev:internal
bun run dev:daemon
```

Local logs:

```sh
bun run logs
pier logs dump --api local --state local --project pier-demo --markdown
```

## Checks

```sh
bun run check-types
bun run test
bun run inspect
bun run plan
```

This repo is not the Pier control plane. Domains, previews, backups,
billing, Cloudflare account operations, organization RBAC, and platform
telemetry belong in `/Users/dawson/projects/hosting-platform`.

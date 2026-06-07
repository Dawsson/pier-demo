# Waypoint Guest App

This repo is the product-template app for Waypoint. It demonstrates a small
counter product deployed through Waypoint with separate public and admin
TanStack Start apps.

## Apps

```text
apps/web       Public/user TanStack Start app
apps/admin     Admin TanStack Start app
apps/api       API Worker with Better Auth, D1, KV, internal service binding, and Durable Object binding
apps/internal  Internal Worker RPC service
```

The counter is global. Public users can read and increment it by `1`.
Signed-in users increment through the same API mutation with a `5x` multiplier.
The API Worker uses `RateLimiterObject` to rate-limit counter mutations before
writing to D1.

## Auth

The API mounts Better Auth at `/auth/*` through Waypoint's API Worker wrapper.
Auth is email/password only. Admin access uses the Better Auth admin plugin;
there is intentionally no first-admin bootstrap helper in this template.

## Waypoint

The app declares its topology in `platform.config.ts`:

- `web` and `admin` are TanStack Start apps.
- `api` owns D1, KV, the internal service binding, and the `RATE_LIMITER`
  Durable Object namespace.
- `internal` is an internal Worker service.

Generated `.waypoint` modules are the source of truth for runtime env and API
context. Regenerate them after config changes:

```sh
bun run env:types
```

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
bun way logs dump --api local --state local --project waypoint-guest-app --markdown
```

## Checks

```sh
bun run check-types
bun run test
bun run inspect
bun run plan
```

This repo is not the Waypoint control plane. Domains, previews, backups,
billing, Cloudflare account operations, organization RBAC, and platform
telemetry belong in `/Users/dawson/projects/hosting-platform`.

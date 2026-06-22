# Agent Instructions

## Project

This repo is `pier-demo`, the product-template/example app for
Pier. The platform itself lives in `/Users/dawson/projects/hosting-platform`.

Use this repo to demonstrate how a product consumes Pier:

- Public/user TanStack Start app in `apps/web`.
- Admin TanStack Start app in `apps/admin`.
- Hono API Worker in `apps/api`.
- internal Worker service in `apps/internal`.
- Postgres counter state plus a Pier-managed `RATE_LIMITER` binding owned by the API Worker.
- production Zero runs as a separate `zero-cache` deployment; this repo wires
  the API/web contract and required env, but does not pretend Zero is deployed
  by the app slots.
- app intent, bindings, env vars, roles, permissions, and event catalogs in
  `platform.config.ts`.
- typed app/agent guidance through `agent.context`.

Do not implement control-plane features here. Domains, previews, backups,
restore planning, billing/usage ingestion, organization RBAC, invitations,
Cloudflare account mutations, and platform-admin telemetry belong in Pier.

## Local Dev And Logs

- Start the full local session with `bun run dev`. For individual services,
  use `dev restart <service> --cwd /Users/dawson/projects/waypoint-guest-app`
  against the running dev session.
- Use Pier cloud env as the runtime source of truth. Do not add `.env` setup
  instructions or local dotenv fallbacks for required app values.
- Local development uses the Pier cloud dev Postgres database plus local
  `zero-cache`; do not introduce a separate local Postgres path unless the
  project intentionally changes that strategy.
- Keep database setup on real Drizzle migrations in `apps/api/drizzle`. Do not
  add manual schema bootstrap or ad hoc table-creation fallbacks.
- Production migrations run with
  `DATABASE_URL=<production url> bun run db:migrate` before deploy. App runtime
  values still come from Pier cloud env.
- Worker services use Pier's Miniflare-backed local runtime and rebuild into
  `.pier/build/dev/<app>` on source changes. Do not add product-owned
  Wrangler config.
- `pier dev` logs should be sent to the Pier local daemon, which always runs
  locally on development devices.
- Local-only projects belong in the Pier dashboard under `/dev`.
- Hosted/cloud projects belong under `/projects`.
- For this template, inspect local logs at `/dev/pier-demo/logs`.
- Remote agents should use hosted control-plane logs unless they can reach this
  machine's local daemon.

## Commands

Use Bun.

```sh
bun run check-types
bun run test
bun run check
bun run smoke:prod
```

Useful platform checks:

```sh
bun run env:types
DATABASE_URL=<production url> bun run db:migrate
pier inspect --json
pier plan
pier logs --state local --project pier-demo
pier logs dump --state local --project pier-demo --markdown
```

For Zero/runtime checks, prefer routed proof:

```sh
dev status --cwd /Users/dawson/projects/waypoint-guest-app
curl -fsS https://zero.pierdemo.dev.dawson.gg/keepalive
curl -sS -X POST https://api.pierdemo.dev.dawson.gg/rpc/publicCounter/current \
  -H 'content-type: application/json' --data '{}'
dev logs api --cwd /Users/dawson/projects/waypoint-guest-app --tail 80
dev logs zero --cwd /Users/dawson/projects/waypoint-guest-app --tail 80
```

## Guardrails

- Never commit `.env`, `.env.dev`, or secrets.
- Prefer Pier cloud env for required runtime values. Use `platform.config.ts`
  plus `pier env types`; do not add product-owned dotenv loading or local
  dotenv fallbacks.
- Use Pier cloud env whenever Pier can provide the value. The direct
  `DATABASE_URL` migration input is a narrow exception because migrations run
  outside the Worker binding runtime.
- Keep production deploys passing `PIER_ZERO_CACHE_URL`; it feeds
  `PUBLIC_ZERO_CACHE_URL` for the browser app.
- Keep app code declarative; prefer `platform.config.ts` over bespoke
  Cloudflare glue.
- Do not import API runtime modules into the browser bundle.
- Use generated `.pier` env helpers instead of hand-written env casts.
- Keep browser apps calling typed API clients; do not bind Durable Objects
  directly from TanStack Start apps.
- Keep changes focused and run the smallest useful validation.

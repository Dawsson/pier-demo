# Agent Instructions

## Project

This repo is `waypoint-guest-app`, the product-template/example app for
Waypoint. The platform itself lives in `/Users/dawson/projects/hosting-platform`.

Use this repo to demonstrate how a product consumes Waypoint:

- Public/user TanStack Start app in `apps/web`.
- Admin TanStack Start app in `apps/admin`.
- Hono API Worker in `apps/api`.
- internal Worker service in `apps/internal`.
- D1 counter state plus a `RATE_LIMITER` Durable Object owned by the API Worker.
- app intent, bindings, env vars, roles, permissions, and event catalogs in
  `platform.config.ts`.
- typed app/agent guidance through `agent.context`.

Do not implement control-plane features here. Domains, previews, backups,
restore planning, billing/usage ingestion, organization RBAC, invitations,
Cloudflare account mutations, and platform-admin telemetry belong in Waypoint.

## Local Dev And Logs

- Start the full local session with `bun run dev`, or run individual services
  with `bun run dev:daemon`, `bun run dev:internal`, `bun run dev:api`,
  `bun run dev:web`, and `bun run dev:admin`.
- Worker services use Waypoint's Miniflare-backed local runtime and rebuild into
  `.waypoint/build/dev/<app>` on source changes. Do not add product-owned
  Wrangler config.
- `way dev` logs should be sent to the Waypoint local daemon, which always runs
  locally on development devices.
- Local-only projects belong in the Waypoint dashboard under `/dev`.
- Hosted/cloud projects belong under `/projects`.
- For this template, inspect local logs at `/dev/waypoint-guest-app/logs`.
- Remote agents should use hosted control-plane logs unless they can reach this
  machine's local daemon.

## Commands

Use Bun.

```sh
bun run check-types
bun run test
bun run check
```

Useful platform checks:

```sh
bun run inspect
bun run plan
bun run env:types
bun way logs --api local --state local --project waypoint-guest-app
bun way logs dump --api local --state local --project waypoint-guest-app --markdown
```

## Guardrails

- Never commit `.env.dev` or secrets.
- Keep app code declarative; prefer `platform.config.ts` over bespoke
  Cloudflare glue.
- Do not import API runtime modules into the browser bundle.
- Use generated `.waypoint` env helpers instead of hand-written env casts.
- Keep browser apps calling typed API clients; do not bind Durable Objects
  directly from TanStack Start apps.
- Keep changes focused and run the smallest useful validation.

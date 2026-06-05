# Agent Instructions

## Project

This repo is `waypoint-guest-app`, the product-template/example app for
Waypoint. The platform itself lives in `/Users/dawson/projects/hosting-platform`.

Use this repo to demonstrate how a product consumes Waypoint:

- TanStack Start frontend in `apps/web`.
- Hono API Worker in `apps/api`.
- internal Worker service in `apps/internal`.
- app intent, bindings, env vars, roles, permissions, and event catalogs in
  `platform.config.ts`.
- typed app/agent guidance through `api.agentContext`.

Do not implement control-plane features here. Domains, previews, backups,
restore planning, billing/usage ingestion, organization RBAC, invitations,
Cloudflare account mutations, and platform-admin telemetry belong in Waypoint.

## Local Dev And Logs

- Start app services with `bun way dev internal`, `bun way dev api`, and
  `bun way dev web`, or use the repo `dev.json`.
- `way dev` logs should be sent to the Waypoint local daemon when it is running.
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
- Keep changes focused and run the smallest useful validation.

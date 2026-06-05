# Waypoint Guest App

This repo is a working demo app for the current Waypoint hosting-platform shape.

It is intentionally small, but it exercises the important pieces:

- TanStack Start public web app.
- Hono API Worker.
- internal Worker reached only through a Worker-to-Worker binding.
- Better Auth mounted on the API Worker.
- Better Auth anonymous sessions for guest access.
- D1 through `ctx.db`.
- typed API client calls from a browser-safe contract module.
- generated runtime env modules from `platform.config.ts`.
- deploy artifact builds for Worker and TanStack Start apps.
- agent-readable context through a typed `api.agentContext` query.
- local dev through `bun way dev <app>`.

The goal is to keep the platform honest: app code declares intent, Waypoint
handles Cloudflare wiring, auth, bindings, local URLs, build artifacts, and
environment shape, and frontend code calls the API through typed functions
without importing server runtime modules.

This repo is not the Waypoint control plane. Domains, preview URL creation,
backup replication, restore planning, usage ingestion, billing views,
organization/project RBAC, invitations, and Cloudflare account operations belong
in `/Users/dawson/projects/hosting-platform` and should be operated primarily
through the Waypoint dashboard plus CLI/API. This app should only declare what
it needs through `platform.config.ts` and demonstrate how a product consumes the
platform contract.

Waypoint's broader motivation is to make production safer for humans and agents:
agents should be able to inspect events, logs, deploys, resource state, and
environment differences without broad destructive credentials. The same model
should eventually support agency client hosting, where deploys, backups,
observability, and environment management become a reliable hosting upcharge
instead of one-off infrastructure work.

## Apps

```text
apps/web       TanStack Start frontend
apps/api       public API Worker
apps/internal  internal Worker RPC service
```

The web app imports the browser-safe API contract value:

```ts
import { contract } from "../../api/src/contract";
```

That keeps the frontend client type-safe without pulling Worker context,
database, Better Auth server adapters, or provider code into the browser bundle.

## Auth

The API mounts Better Auth at `/auth/*`:

```ts
export default api.worker(contract, {
  waypointAuth: ({ auth }) => auth,
});
```

The public route can create an anonymous Better Auth session. The protected
`/workspace` route uses TanStack Router `beforeLoad` to create or reuse that
anonymous session before rendering, then calls the protected `api.me` query.

That means guest mode is real auth, not a fake local flag. The browser receives
a Better Auth anonymous session cookie, the API reads it through middleware, and
the typed client can call protected queries without importing API runtime code.

## Waypoint CLI

This repo consumes the local Waypoint CLI through the `@waypoint/cli` workspace
dependency. Use `bun way ...` for direct commands or the root scripts for common
template operations:

```sh
bun run inspect
bun run plan
bun run submit
bun run env:types
bun run logs
```

Deploy planning is read-only. Real deploys build artifacts, upload to the
Waypoint control plane, reconcile Cloudflare resources, record deployment state,
and use stored environment variables/secrets when local values are not provided.

```sh
bun way deploy api --env dev
bun way deploy web --env dev
```

## Development

Install dependencies:

```sh
bun install
```

This local checkout includes `../hosting-platform/packages/*` in its Bun
workspace so private Waypoint packages can resolve their internal `workspace:*`
dependencies while the platform is still unpublished. The `dev` startup does
not run `bun install` automatically; run installs intentionally from the repo
you are changing so package links do not drift while the local platform is under
active development.

Run individual services:

```sh
bun way dev internal
bun way dev api
bun way dev web
```

Or start the dev CLI session from this repo with the configured `dev.json`.

## Checks

```sh
bun run check-types
bun run test
bun run inspect
bun run plan
```

The API Worker bootstraps the small local D1 schema used by this example so the
anonymous-auth flow works immediately in local development. A real Waypoint
control plane should replace that with managed migrations.

The workspace stream demo uses `readEventStream()` for ordinary product SSE.
The AI Gateway demo uses `readAiGatewayEventStream()` so browser code handles
Waypoint's provider-neutral `meta`, `chunk`, `done`, and sanitized `error`
events without copying a custom parser.
The web helper also exposes `collectAiGatewayExample()` for tests and simple
clients that need the final chunks, joined text, safe metadata, done state, and
sanitized errors instead of live callbacks.
The API also exposes `api.agentContext`, a typed read-only query for agents. It
returns app slots, bindings, env names, guardrails, and stable commands for
inspection, type checks, local dev, and artifact-build verification.
It also names the Waypoint dashboard paths and CLI commands for local daemon log
inspection, so local-only work uses `/dev/waypoint-guest-app/logs` while hosted
projects use the normal `/projects` surfaces.
It also includes the current AI Gateway endpoint plan for new integrations. The
template streaming route stays mocked and does not call AI Gateway; the endpoint
plan points production work at Waypoint's REST API OpenAI-compatible guidance.
The same context includes a responsibility map that separates product-owned code
from platform-owned operations, so agents keep domains, backups, usage, billing,
and RBAC work in Waypoint itself instead of this example repo.

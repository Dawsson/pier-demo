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

## Control Plane Direction

The platform repo now exposes the first control-plane shape:

```sh
bun ../hosting-platform/packages/cli/src/index.ts inspect platform.config.ts --json
bun ../hosting-platform/packages/cli/src/index.ts deploy api platform.config.ts --dry-run --api local --json
bun ../hosting-platform/packages/cli/src/index.ts deploy web platform.config.ts --dry-run --api local --json
```

Dry-run deploy planning is local and does not require a configured control-plane
database. Real deploys build artifacts, upload to the Waypoint control plane,
reconcile Cloudflare resources, record deployment state, and use stored
environment variables/secrets when local values are not provided.

The intended final path is manifest plus artifact upload to a central
control-plane Worker, which reconciles Cloudflare resources, records deploy
state, manages environment variables and bindings, and gives agents audited read
access to production diagnostics.

## Development

Install dependencies:

```sh
bun install
```

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
PUBLIC_API_URL=http://127.0.0.1:8787 PUBLIC_APP_NAME="Waypoint Guest" PUBLIC_APP_URL=http://127.0.0.1:5173 APP_URL=http://127.0.0.1:8787 BETTER_AUTH_SECRET=dev-secret bun -e 'import { buildAppArtifact } from "../hosting-platform/packages/app-build/src/index.ts"; const config=(await import("./platform.config.ts")).default; for (const appName of ["api", "web"]) { const artifact=await buildAppArtifact({ config, appName, env: process.env }); console.log(JSON.stringify({ appName, mainModule: artifact.mainModule, modules: artifact.modules.length, staticAssets: artifact.staticAssets?.length ?? 0 })); }'
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
It also includes the current AI Gateway endpoint plan for new integrations. The
template streaming route stays mocked and does not call AI Gateway; the endpoint
plan points production work at Waypoint's REST API OpenAI-compatible guidance.
The same context includes a responsibility map that separates product-owned code
from platform-owned operations, so agents keep domains, backups, usage, billing,
and RBAC work in Waypoint itself instead of this example repo.

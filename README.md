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
- local dev through `bun way dev <app>`.

The goal is to keep the platform honest: app code declares intent, Waypoint
handles Cloudflare wiring, auth, bindings, local URLs, build artifacts, and
environment shape, and frontend code calls the API through typed functions
without importing server runtime modules.

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
PUBLIC_API_URL=http://127.0.0.1:8787 PUBLIC_APP_NAME="Waypoint Guest" PUBLIC_APP_URL=http://127.0.0.1:5173 APP_URL=http://127.0.0.1:8787 BETTER_AUTH_SECRET=dev-secret bun -e 'import { buildAppArtifact } from "../hosting-platform/packages/app-build/src/index.ts"; const config=(await import("./platform.config.ts")).default; for (const appName of ["api", "web"]) { const artifact=await buildAppArtifact({ config, appName, env: process.env }); console.log(JSON.stringify({ appName, mainModule: artifact.mainModule, modules: artifact.modules.length, staticAssets: artifact.staticAssets?.length ?? 0 })); }'
```

The API Worker bootstraps the small local D1 schema used by this example so the
anonymous-auth flow works immediately in local development. A real Waypoint
control plane should replace that with managed migrations.

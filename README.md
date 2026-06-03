# Waypoint Guest App

This repo is a public example of what an app could look like on a more opinionated
Waypoint hosting platform.

It is intentionally small, but it exercises the important pieces:

- TanStack Start public web app.
- Hono API Worker.
- internal Worker reached only through a Worker-to-Worker binding.
- Better Auth mounted on the API Worker.
- Better Auth anonymous sessions for guest access.
- D1 through `ctx.db`.
- typed API client calls from a type-only contract export.
- local dev through `bun way dev <app>`.

The goal is not to be a product template yet. It is a working reference app for
the desired developer experience: app code declares intent, Waypoint handles the
Cloudflare wiring, and frontend code calls the API through typed functions.

## Apps

```text
apps/web       TanStack Start frontend
apps/api       public API Worker
apps/internal  internal Worker RPC service
```

The web app imports only the API contract type:

```ts
import type { ApiContract } from "../../api/src/contract";
```

That keeps the frontend client type-safe without importing API runtime code.

## Auth

The API mounts Better Auth at `/auth/*`:

```ts
export default api.worker(contract, {
  authHandler: (ctx) => ctx.auth,
});
```

The public route can create an anonymous Better Auth session. The protected
`/workspace` route uses TanStack Router `beforeLoad` to create or reuse that
anonymous session before rendering, then calls the protected `api.me` query.

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
```

The API Worker bootstraps the small local D1 schema used by this example so the
anonymous-auth flow works immediately in local development. A real Waypoint
control plane should replace that with managed migrations.

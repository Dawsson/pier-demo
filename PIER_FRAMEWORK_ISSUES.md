# Pier Issues Found During Demo Migration

- `@pier/cli` is not installable from `https://api.buildwithharbor.com/npm/`.
  External repos can install framework packages with `pier package install`,
  but CI has no clean way to run `pier env types`, `pier run`, or `pier deploy`
  without either a preinstalled CLI or checking out the private platform source.
  `pier-demo` currently needs `PIER_PLATFORM_CHECKOUT_TOKEN` only for that
  source-checkout bridge. Once the CLI is published, GitHub Actions should only
  need one Pier key.
- `pier env types` emits generated `apps/*/src/.pier/*` files that fail
  consumer lint rules (`no-unused-vars` and `unicorn/no-useless-fallback-in-spread`).
  The generator should emit lint-clean code or include generated-file ignore
  guidance/scaffolding.
- The Pier CLI can inspect a local `platform.config.ts`, but cloud commands fail
  with `Project not found` for a new external repo and there is no
  `pier project create` / `pier project upsert` command or project-create API
  contract exposed to consumers.
- `@pier/db` expects Postgres env as `DATABASE_URL` or `HYPERDRIVE`, while
  generated Pier env types expose `binding.postgres("shared")` under the
  configured binding name (`DB` in `pier-demo`). Consumer apps currently need an
  adapter such as `{ HYPERDRIVE: env.DB }`; the package should accept generated
  Postgres bindings directly.
- CLI auth/deploy failures are hard to diagnose when the stored local API key is
  valid Better Auth material but has no organization scope. `pier auth status`
  reports authenticated, while org/project/deploy commands fail later with
  `Unauthorized`, `Authenticated user is required`, or `Service key is missing
  organization scope`. The CLI should identify the credential kind/scope and
  guide operators to login or create a scoped service key before deploy.
- `pier config api-key create --store` looks like a recovery path, but it
  depends on an already-valid human credential. With a legacy/unscoped service
  key, production returned a blank 500 instead of a structured 401/403 and a
  clear instruction to run `pier login`.
- Device login had propagation/health instability while testing:
  `/auth/device/code` alternated between valid device-code responses and blank
  500 responses. This blocks the safest recovery path for external repo setup
  and should emit structured `pier.auth.handler.failed` logs plus user-facing
  CLI errors.
- A single external-project CI key currently has to be broader than ideal. The
  same key must install private Pier packages, resolve Pier cloud env for
  `pier run`, generate env types, and deploy. The framework should provide a
  first-class project CI preset that encodes those operations safely instead of
  forcing agents to choose between an incomplete allowlist and an org-scoped
  all-operation service key.
- Production API commands failed after switching the platform API to
  Hyperdrive-only DB access because the Hyperdrive runtime role did not have
  grants on newer control-plane tables. The platform should grant runtime roles
  automatically during DB provisioning/migration, including default privileges
  for future tables.
- `drizzle-kit generate --custom` failed in the platform API with a snapshot
  parent collision around existing snapshot files. Custom migration creation
  should be reliable, or the repo should have a documented Pier migration helper
  for SQL-only migrations such as grants.

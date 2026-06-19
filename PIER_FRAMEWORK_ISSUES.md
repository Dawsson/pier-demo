# Pier Issues Found During Demo Migration

- `@pier/cli` is not installable from `https://api.buildwithharbor.com/npm/`.
  External repos can install framework packages with `pier package install`,
  but CI has no clean way to run `pier env types`, `pier run`, or `pier deploy`
  without either a preinstalled CLI or checking out the private platform source.
  `pier-demo` currently needs `PIER_PLATFORM_CHECKOUT_TOKEN` only for that
  source-checkout bridge. Once the CLI is published as a public package or
  installer, GitHub Actions should only need one Pier key plus non-secret org
  configuration.
- The temporary CLI source checkout is branch-coupled. A demo deploy rerun kept
  failing with a stale CLI because the workflow cloned `withharbor/hosting@main`
  while local platform commits had only been pushed to `master`. Publishing the
  CLI as a normal public install removes this class of CI drift entirely.
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
- Managed deploys silently drop `binding.postgres("shared")` as a Cloudflare
  binding. The manifest and generated env types preserve `DB`, but the platform
  deploy resolver only materializes KV, D1, R2, Hyperdrive, service, images,
  queue, and Durable Objects. `pier-demo` currently works around this by
  declaring one sensitive `DATABASE_URL` cloud value for the API app, letting
  generated env synthesis create `DB: { connectionString }`. Pier should make
  `binding.postgres` first-class by provisioning the shared schema/role and
  wiring the runtime value automatically.
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
- `pier config api-key set --value-stdin` fails in GitHub Actions with
  `libsecret not available`. Core Pier API calls can use `PIER_API_KEY`
  directly, but `pier package install` still expects a stored key, so CI has to
  set `PIER_REGISTRY_TOKEN=$PIER_API_KEY` and call `bun install` directly. The
  package command should accept env-based auth in noninteractive CI.
- Production API commands failed after switching the platform API to
  Hyperdrive-only DB access because the Hyperdrive runtime role did not have
  grants on newer control-plane tables. The platform should grant runtime roles
  automatically during DB provisioning/migration, including default privileges
  for future tables.
- `drizzle-kit generate --custom` failed in the platform API with a snapshot
  parent collision around existing snapshot files. Custom migration creation
  should be reliable, or the repo should have a documented Pier migration helper
  for SQL-only migrations such as grants.
- `pier shared-postgres` CLI usage/help is inconsistent. `pier shared-postgres
provision ...` appears in help, but flags are parsed only when placed before
  the `provision` positional, and a normal shell `source` of the generated env
  file can choke on unquoted URLs containing `&`. The CLI should provide a
  direct `pier shared-postgres provision ... --set-cloud-env --app api` style
  path so agents never parse or pipe secret URLs by hand.
- `pier run --env prod -- ...` failed in GitHub Actions through the
  source-installed CLI by resolving `prod` as a config module path. `pier-demo`
  now calls `pier deploy all --env prod` directly, but `pier run` flag parsing
  should be hardened because it is the nicer long-term cloud-env wrapper.
- External CI still needs `PIER_ORGANIZATION_ID` next to the single
  `PIER_API_KEY` so deploy commands target the intended organization. It now
  comes from GitHub Actions variables rather than being hard-coded. That is
  acceptable as non-secret metadata, but the CLI should make missing or
  mismatched org context obvious before deploy.

# Pier Issues Found During Demo Migration

- `@pier/cli` is not installable from `https://api.buildwithharbor.com/npm/`.
  External repos can install framework packages with `PIER_REGISTRY_TOKEN`, but
  CI has no clean way to run `pier env types`, `pier run`, or `pier deploy`
  without either a preinstalled CLI or checking out the platform source.
  `pier-demo` currently uses a source-checkout bridge in GitHub Actions until
  the CLI can be installed like a normal Pier package.
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

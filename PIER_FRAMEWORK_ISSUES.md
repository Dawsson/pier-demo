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

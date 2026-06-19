# Pier Issues Found During Demo Migration

- Managed deploys silently drop `binding.postgres("shared")` as a Cloudflare
  binding. The manifest and generated env types preserve `DB`, but the platform
  deploy resolver only materializes KV, D1, R2, Hyperdrive, service, images,
  queue, and Durable Objects. `pier-demo` currently works around this by
  declaring one sensitive `DATABASE_URL` cloud value for the API app, letting
  generated env synthesis create `DB: { connectionString }`. Pier should make
  `binding.postgres` first-class by provisioning the shared schema/role and
  wiring the runtime value automatically.
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
- External CI still needs `PIER_ORGANIZATION_ID` next to the single
  `PIER_API_KEY` so deploy commands target the intended organization. It now
  comes from GitHub Actions variables rather than being hard-coded. That is
  acceptable as non-secret metadata, but the CLI should make missing or
  mismatched org context obvious before deploy.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../apps/api/src/db/schema";

const migrationsFolder = "apps/api/drizzle";
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:pass@127.0.0.1:55432/zero";
const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
const db = drizzle(client, { schema });

await baselineExistingInitialSchema();
await migrate(db, { migrationsFolder });
await db.execute(sql`
  insert into "counter_state" ("id", "value", "updated_at")
  values ('global', 0, now()::text)
  on conflict ("id") do nothing
`);
await db.execute(sql`
  do $$
  begin
    if not exists (
      select 1 from pg_publication where pubname = 'pier_demo_sync'
    ) then
      execute 'create publication pier_demo_sync for table "counter_state", "user"';
    end if;
  end
  $$;
`);
await db.execute(sql`alter publication pier_demo_sync set table "counter_state", "user"`);

await client.end();
process.exit(0);

async function baselineExistingInitialSchema() {
  const journal = JSON.parse(readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8")) as {
    readonly entries: readonly [
      {
        readonly tag: string;
        readonly when: number;
      },
    ];
  };
  const [initialMigration] = journal.entries;
  const migrationSql = readFileSync(`${migrationsFolder}/${initialMigration.tag}.sql`, "utf8");
  const expectedTables = [
    "account",
    "counter_increment",
    "counter_state",
    "session",
    "user",
    "verification",
  ];
  const existingTables = await client<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any(${expectedTables})
  `;
  const tableNames = new Set(existingTables.map((table) => table.table_name));

  if (tableNames.size === 0) {
    return;
  }

  await client`create schema if not exists "drizzle"`;
  await client`
    create table if not exists "drizzle"."__drizzle_migrations" (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `;

  const [{ count }] = await client<{ count: number }[]>`
    select count(*)::int as count from "drizzle"."__drizzle_migrations"
  `;

  if (count > 0) {
    return;
  }

  const missingTables = expectedTables.filter((table) => !tableNames.has(table));
  if (missingTables.length > 0) {
    throw new Error(
      `Existing database has a partial pre-Drizzle schema. Missing tables: ${missingTables.join(", ")}. Run \`bun run zero:reset\` to recreate the local dev database.`,
    );
  }

  await client`
    insert into "drizzle"."__drizzle_migrations" ("hash", "created_at")
    values (${createHash("sha256").update(migrationSql).digest("hex")}, ${initialMigration.when})
  `;
}

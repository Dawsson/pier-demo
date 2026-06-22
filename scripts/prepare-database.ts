import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = "apps/api/drizzle";
const publicationName = "pier_demo_sync";

export async function prepareDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  const db = drizzle(client);

  try {
    const [{ schemaName }] = await client<{ schemaName: string }[]>`
      select current_schema() as "schemaName"
    `;

    await migrate(db, {
      migrationsFolder,
      migrationsSchema: schemaName,
    });
    await db.execute(sql`
      insert into "counter_state" ("id", "value", "updated_at")
      values ('global', 0, now()::text)
      on conflict ("id") do nothing
    `);
    await client.unsafe(`
      do $$
      begin
        if not exists (
          select 1 from pg_publication where pubname = '${publicationName}'
        ) then
          execute 'create publication ${quoteIdentifier(publicationName)} for table "counter_state", "user"';
        end if;
      end
      $$
    `);
    await client.unsafe(
      `alter publication ${quoteIdentifier(publicationName)} set table "counter_state", "user"`,
    );
  } finally {
    await client.end();
  }
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

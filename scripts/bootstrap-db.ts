import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../apps/api/src/db/schema";

const migrationsFolder = "apps/api/drizzle";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Run `dev restart api` before bootstrapping Zero.");
}

const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
const db = drizzle(client, { schema });
const [{ schemaName }] = await client<{ schemaName: string }[]>`
  select current_schema() as "schemaName"
`;

await migrate(db, { migrationsFolder, migrationsSchema: schemaName });
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

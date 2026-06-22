import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../apps/api/src/db/schema";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:pass@127.0.0.1:55432/zero";
const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

await migrate(db, { migrationsFolder: "apps/api/drizzle" });
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

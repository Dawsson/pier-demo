import { sql } from "drizzle-orm";
import { createDb } from "../apps/api/src/db";
import { ensureDatabaseSchema } from "../apps/api/src/db/bootstrap";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:pass@127.0.0.1:55432/zero";
const db = createDb({
  DB: { connectionString: databaseUrl },
} as never);

await ensureDatabaseSchema(db);
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

process.exit(0);

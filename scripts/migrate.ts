import { prepareDatabase } from "./prepare-database";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run Drizzle migrations.");
}

await prepareDatabase(process.env.DATABASE_URL);

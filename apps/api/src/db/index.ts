import { createPierPostgresDb } from "@pier/db";
import type { Env } from "../.pier/env";
import * as schema from "./schema";

export const createDb = (env: Env) => {
  const db = createPierPostgresDb({
    env: {
      HYPERDRIVE: env.DB,
      PIER_ENV: "prod",
    },
    schema,
  });

  if (!db) {
    throw new Error("Pier Postgres DB binding is not configured.");
  }

  return db;
};

export type AppDb = ReturnType<typeof createDb>;
export { schema };

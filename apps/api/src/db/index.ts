import { createWaypointPostgresDb } from "@waypoint/db";
import type { Env } from "../.waypoint/env";
import * as schema from "./schema";

export const createDb = (env: Env) => {
  const db = createWaypointPostgresDb({
    env: {
      DATABASE_URL: env.DB.connectionString,
      NODE_ENV: "dev",
    },
    schema,
  });

  if (!db) {
    throw new Error("Waypoint Postgres DB binding is not configured.");
  }

  return db;
};

export type AppDb = ReturnType<typeof createDb>;
export { schema };

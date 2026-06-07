import { createWaypointAuth } from "@waypoint/auth";
import { admin } from "better-auth/plugins";
import { projectTopology, type Env } from "./.waypoint/env";
import type { AppDb } from "./db";
import { schema } from "./db";

export const createAuth = (env: Env, db: AppDb) =>
  createWaypointAuth({
    betterAuth: {
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        admin({
          adminRoles: ["admin"],
          defaultRole: "user",
        }),
      ],
    },
    database: {
      drizzle: db,
      provider: "pg",
      schema,
    },
    env: {
      API_URL: env.API_URL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      WEB_URL: env.WEB_URL,
    },
    origins: {
      extra: [env.ADMIN_URL.href],
    },
    projectTopology,
  });

export type AppAuth = ReturnType<typeof createAuth>;

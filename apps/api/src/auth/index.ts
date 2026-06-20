import { createKvSecondaryStorage, createPierAuth } from "@pier/auth";
import { admin } from "better-auth/plugins";
import { projectTopology, type Env } from "../.pier/env";
import type { AppDb } from "../db";
import { schema } from "../db";

export const createAuth = (env: Env, db: AppDb) =>
  createPierAuth({
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
    secondaryStorage: createKvSecondaryStorage(env.CACHE, {
      prefix: "pier-demo:auth:",
    }),
  });

export type AppAuth = ReturnType<typeof createAuth>;

import { createKvSecondaryStorage, createPierAuth } from "@pier/auth";
import { anonymous } from "better-auth/plugins/anonymous";
import { admin } from "better-auth/plugins";
import { projectTopology, type Env } from "#/.pier/env";
import type { AppDb } from "#/db";
import { schema } from "#/db";

export const createAuth = (env: Env, db: AppDb) =>
  createPierAuth({
    betterAuth: {
      projectTopology,
      emailAndPassword: {
        enabled: true,
      },

      plugins: [
        anonymous({
          emailDomainName: "anonymous.pier-demo.local",
          generateName: () => "Anonymous guest",
        }),
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

    secondaryStorage: createKvSecondaryStorage(env.CACHE, {
      prefix: "pier-demo:auth:",
    }),
  });

export type AppAuth = ReturnType<typeof createAuth>;

import { createWaypointAuth } from "@waypoint/auth";
import { anonymous, organization } from "better-auth/plugins";
import type { ApiEnv } from "./env";
import type { AppDb } from "./db";
import { schema } from "./db";

const appUrl = (env: ApiEnv) => env.DEV_WEB_URL ?? env.PUBLIC_APP_URL;
const apiUrl = (env: ApiEnv) => env.DEV_API_URL ?? env.PUBLIC_APP_URL;

export const createAuth = (env: ApiEnv, db: AppDb) => {
  const publicAppUrl = appUrl(env);

  return createWaypointAuth({
    db,
    env,
    schema,
    betterAuth: {
      baseURL: apiUrl(env),
      emailAndPassword: {
        enabled: true,
      },
      plugins: [
        anonymous({
          emailDomainName: "guest.waypoint.local",
          generateName: () => "Guest Operator",
        }),
        organization({
          teams: {
            enabled: true,
          },
        }),
      ],
      trustedOrigins: [publicAppUrl],
    },
  });
};

export type AppAuth = ReturnType<typeof createAuth>;

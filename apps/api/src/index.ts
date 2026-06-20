import { healthStatus } from "@pier/backend";

import type { Env } from "./.pier/env";
import { api } from "./api";
import { RateLimiterObject } from "./modules/counter/rate-limiter";
import { operationRoutes, syncRoutes } from "./sync/routes";

export { RateLimiterObject };

const handler: ExportedHandler<Env> = api.worker(
  {},
  {
    features: [
      {
        createRoutes: () => operationRoutes as never,
        name: "pier-operations",
        path: "/operations",
      },
      {
        createRoutes: () => syncRoutes as never,
        name: "pier-sync",
        path: "/zero",
      },
    ],
    health: (env) =>
      healthStatus({
        app: env.PUBLIC_APP_NAME,
        checks: {
          env: { detail: "PUBLIC_APP_NAME is available", ok: Boolean(env.PUBLIC_APP_NAME) },
        },
        surface: "worker",
      }),
    pierAuth: ({ auth }) => auth,
  },
);

export default handler;

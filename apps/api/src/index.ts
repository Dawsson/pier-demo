import { healthStatus } from "@pier/backend";

import type { Env } from "./.pier/env";
import { api } from "./api";
import { routes } from "./routes";
import { syncFeature } from "./sync/feature";

const handler: ExportedHandler<Env> = api.worker(routes, {
  features: [syncFeature],
  health: (env) =>
    healthStatus({
      app: env.PUBLIC_APP_NAME,
      checks: {
        env: { detail: "PUBLIC_APP_NAME is available", ok: Boolean(env.PUBLIC_APP_NAME) },
      },
      surface: "worker",
    }),
  pierAuth: ({ auth }) => auth,
});

export default handler;

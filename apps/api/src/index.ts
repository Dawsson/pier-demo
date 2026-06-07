import { healthStatus } from "@waypoint/backend";
import type { Env } from "./.waypoint/env";
import { api } from "./procedures";
import { routes } from "./router";
export { RateLimiterObject } from "./rate-limiter";

const handler: ExportedHandler<Env> = api.worker(routes, {
  health: (env) =>
    healthStatus({
      app: env.PUBLIC_APP_NAME,
      checks: { env: { detail: "PUBLIC_APP_NAME is available", ok: Boolean(env.PUBLIC_APP_NAME) } },
      surface: "worker",
    }),
  waypointAuth: ({ auth }) => auth,
});

export default handler;

import { healthStatus } from "@waypoint/backend";
import { publicProcedure } from "../procedures";

export const healthEndpoint = publicProcedure.health.query({
  run: ({ ctx }) =>
    healthStatus({
      app: ctx.env.PUBLIC_APP_NAME,
      checks: {
        auth: { detail: "Better Auth context initialized", ok: Boolean(ctx.auth) },
        db: { detail: "Postgres binding initialized", ok: Boolean(ctx.env.DB) },
        rateLimiter: {
          detail: "Durable Object binding initialized",
          ok: Boolean(ctx.env.RATE_LIMITER),
        },
      },
      surface: "api",
    }),
});

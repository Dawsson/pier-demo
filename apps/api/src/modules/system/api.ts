import { healthStatus } from "@pier/backend";
import { os } from "#/api";

export const systemRoutes = {
  status: os.system.status.endpoint({
    auth: "public",
    run: ({ ctx }) =>
      healthStatus({
        app: ctx.env.PUBLIC_APP_NAME,
        checks: {
          auth: { detail: "Better Auth context initialized", ok: Boolean(ctx.auth) },
          db: { detail: "Postgres binding initialized", ok: Boolean(ctx.env.DB) },
          rateLimiter: {
            detail: "Rate limit binding initialized",
            ok: Boolean(ctx.env.RATE_LIMITER),
          },
        },
        surface: "api",
      }),
  }),
};

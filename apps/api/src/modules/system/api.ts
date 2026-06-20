import { healthStatus } from "@pier/backend";
import { z } from "zod";

import { emptyInput, type DemoSyncBuilder } from "#/sync/definition";

export const healthOutputSchema = z.object({
  app: z.string(),
  checks: z.record(
    z.string(),
    z.object({
      detail: z.string().optional(),
      ok: z.boolean(),
    }),
  ),
  generatedAt: z.string(),
  ok: z.boolean(),
  surface: z.literal("api"),
});

export const createSystemApi = (t: DemoSyncBuilder) => ({
  status: t.procedure
    .input(emptyInput)
    .output(healthOutputSchema)
    .meta({
      description: "Read API health through a normal typed HTTP endpoint.",
      tags: ["system"],
    })
    .endpoint({ method: "GET", path: "/status" })
    .handler(({ ctx }) =>
      Response.json(
        healthStatus({
          app: ctx.env.PUBLIC_APP_NAME,
          checks: {
            auth: { detail: "Better Auth context initialized", ok: Boolean(ctx.betterAuth) },
            db: { detail: "Postgres binding initialized", ok: Boolean(ctx.env.DB) },
            rateLimiter: {
              detail: "Rate limit binding initialized",
              ok: Boolean(ctx.env.RATE_LIMITER),
            },
          },
          surface: "api",
        }),
      ),
    ),
});

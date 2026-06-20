import { z } from "zod";

import { emptyInput, type DemoSyncBuilder } from "../../sync/definition";

export const agentContextOutputSchema = z.object({
  apps: z.array(
    z.object({
      bindings: z.array(z.string()),
      kind: z.string(),
      name: z.string(),
      vars: z.array(z.string()),
    }),
  ),
  commands: z.object({
    checkTypes: z.string(),
    dev: z.string(),
    inspect: z.string(),
    logs: z.string(),
    plan: z.string(),
  }),
  project: z.object({
    name: z.literal("pier-demo"),
    template: z.literal("pier-counter-template"),
  }),
});

export const createAgentApi = (t: DemoSyncBuilder) => ({
  context: t.procedure
    .input(emptyInput)
    .output(agentContextOutputSchema)
    .meta({
      description: "Returns agent-readable wiring for the counter template.",
      tags: ["agent"],
    })
    .rpc.query(() => ({
      apps: [
        {
          bindings: [],
          kind: "tanstack-start",
          name: "web",
          vars: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
        },
        {
          bindings: [],
          kind: "tanstack-start",
          name: "admin",
          vars: ["PUBLIC_ADMIN_URL", "PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
        },
        {
          bindings: ["CACHE", "DB", "INTERNAL", "RATE_LIMITER"],
          kind: "api-worker",
          name: "api",
          vars: [
            "ADMIN_URL",
            "API_URL",
            "BETTER_AUTH_SECRET",
            "PUBLIC_ADMIN_URL",
            "PUBLIC_API_URL",
            "PUBLIC_APP_NAME",
            "PUBLIC_WEB_URL",
            "WEB_URL",
          ],
        },
        {
          bindings: ["CACHE"],
          kind: "internal-worker",
          name: "internal",
          vars: [],
        },
      ],
      commands: {
        checkTypes: "bun run check-types",
        dev: "bun run dev",
        inspect: "bun run inspect",
        logs: "pier logs --project pier-demo",
        plan: "bun run plan",
      },
      project: {
        name: "pier-demo" as const,
        template: "pier-counter-template" as const,
      },
    })),
});

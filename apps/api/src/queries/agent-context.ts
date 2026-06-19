import { publicProcedure } from "../procedures";

export const agentContextQuery = publicProcedure.agent.context.query({
  run: () => ({
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
      logs: "pier logs --api local --state local --project pier-demo",
      plan: "bun run plan",
    },
    project: {
      name: "pier-demo" as const,
      template: "pier-counter-template" as const,
    },
  }),
});

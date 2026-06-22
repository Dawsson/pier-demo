import type { z } from "zod";
import { agentContextOutputSchema } from "@pier-demo/api-contract";
import { os } from "#/api";

export const agentContext = {
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
    databaseMigrate: "DATABASE_URL=<production url> bun run db:migrate",
    dev: "bun run dev",
    inspect: "pier inspect --json",
    logs: "pier logs --project pier-demo",
    plan: "pier plan",
    smokeProduction: "SMOKE_ZERO_URL=https://zero.example.com bun run smoke:prod",
  },
  project: {
    name: "pier-demo",
    template: "pier-counter-template",
  },
} satisfies z.infer<typeof agentContextOutputSchema>;

export const agentRoutes = {
  context: os.agent.context.query(() => agentContext),
};

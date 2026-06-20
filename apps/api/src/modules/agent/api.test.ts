import { describe, expect, test } from "bun:test";
import type { z } from "zod";
import { agentContextOutputSchema } from "./api";

const agentContext: z.infer<typeof agentContextOutputSchema> = {
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
    name: "pier-demo",
    template: "pier-counter-template",
  },
};

describe("agent context schema", () => {
  test("documents the counter template app topology", () => {
    expect(agentContextOutputSchema.parse(agentContext)).toEqual(agentContext);
  });
});

import { z } from "zod";

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

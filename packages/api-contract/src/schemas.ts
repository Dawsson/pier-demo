import { z } from "zod";

export const emptyInputSchema = z.object({}).optional();

export const counterAdjustInputSchema = z.object({
  amount: z.union([z.literal(-1), z.literal(1)]),
});

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  step: z.number(),
  updatedAt: z.string(),
  value: z.number(),
});

export const adminSummaryOutputSchema = z.object({
  counter: counterOutputSchema,
  recentIncrements: z.array(
    z.object({
      amount: z.number(),
      authenticated: z.boolean(),
      counterValue: z.number(),
      createdAt: z.string(),
      identity: z.string(),
      userId: z.string().nullable(),
    }),
  ),
});

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

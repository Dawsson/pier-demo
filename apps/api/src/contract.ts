import { contractBuilder as c } from "@pier/backend";
import { z } from "zod";

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  multiplier: z.number(),
  updatedAt: z.string(),
  value: z.number(),
});

export const incrementOutputSchema = counterOutputSchema.extend({
  amount: z.number(),
});

export const meOutputSchema = z.object({
  authenticated: z.boolean(),
  sessionId: z.string().optional(),
  user: z
    .object({
      email: z.string().nullable().optional(),
      id: z.string(),
      name: z.string().nullable().optional(),
      role: z.string().nullable().optional(),
    })
    .optional(),
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

export const contract = c.router({
  account: c.router({
    me: c
      .query()
      .openapi({
        summary: "Current session",
        tags: ["auth"],
      })
      .output(meOutputSchema),
  }),
  admin: c.router({
    summary: c
      .query()
      .openapi({
        summary: "Admin dashboard summary",
        tags: ["admin"],
      })
      .output(adminSummaryOutputSchema),
  }),
  agent: c.router({
    context: c
      .query()
      .openapi({
        description: "Returns agent-readable wiring for the counter template.",
        path: "/agent/context",
        summary: "Agent context",
        tags: ["agent"],
      })
      .output(agentContextOutputSchema),
  }),
  counter: c.router({
    get: c
      .query()
      .openapi({
        summary: "Read counter",
        tags: ["counter"],
      })
      .output(counterOutputSchema),
    increment: c
      .mutation()
      .openapi({
        summary: "Increment counter",
        tags: ["counter"],
      })
      .output(incrementOutputSchema),
  }),
  health: c
    .query()
    .openapi({
      summary: "API health",
      tags: ["system"],
    })
    .output(healthOutputSchema),
});

export type ApiContract = typeof contract;

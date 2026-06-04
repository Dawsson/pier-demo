import { contractBuilder as c } from "@waypoint/backend";
import { z } from "zod";

export const guestInputSchema = z
  .object({
    id: z.string().default("guest"),
  })
  .optional()
  .default({ id: "guest" });

export const guestOutputSchema = z.object({
  auth: z.literal("guest"),
  cache: z.object({
    key: z.string(),
    seenAt: z.string().nullable(),
  }),
  internal: z.object({
    sum: z.number(),
    user: z.unknown(),
  }),
  message: z.string(),
  operation: z.string(),
  services: z.object({
    db: z.boolean(),
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

export const aiGatewayDescriptionOutputSchema = z.object({
  providerCount: z.number(),
  providers: z.array(
    z.object({
      cacheTtlSeconds: z.number().optional(),
      model: z.string().optional(),
      provider: z.string(),
      streaming: z.boolean(),
    }),
  ),
  streaming: z.boolean(),
});

export const meOutputSchema = z.object({
  mode: z.enum(["anonymous", "user"]),
  sessionId: z.string(),
  user: z.object({
    email: z.string().nullable().optional(),
    id: z.string(),
    isAnonymous: z.boolean(),
    name: z.string().nullable().optional(),
  }),
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
    buildArtifacts: z.string(),
    checkTypes: z.string(),
    dev: z.array(z.string()),
    inspect: z.string(),
  }),
  billing: z.object({
    commands: z.object({
      assumptions: z.string(),
      estimate: z.string(),
      scopedEstimate: z.string(),
    }),
    customerBillable: z.literal(false),
    mode: z.literal("recorded-state-estimate"),
    providerMetricsConnected: z.literal(false),
    warnings: z.array(z.string()),
  }),
  domains: z.object({
    commands: z.object({
      cleanupPlan: z.string(),
      inspect: z.string(),
      previewTriggerPlan: z.string(),
    }),
    previewPolicy: z.object({
      allowedActors: z.array(z.string()),
      defaultTtlSeconds: z.number(),
      requiredCommand: z.string(),
    }),
    readOnly: z.literal(true),
    warnings: z.array(z.string()),
  }),
  generatedAt: z.string(),
  guardrails: z.array(z.string()),
  logging: z.object({
    events: z.array(
      z.object({
        description: z.string(),
        name: z.string(),
      }),
    ),
  }),
  permissions: z.object({
    catalog: z.array(
      z.object({
        actions: z.array(z.string()),
        description: z.string(),
        resource: z.string(),
      }),
    ),
    roles: z.array(
      z.object({
        description: z.string(),
        key: z.string(),
        label: z.string(),
        permissions: z.array(z.string()),
      }),
    ),
  }),
  project: z.object({
    name: z.literal("waypoint-guest-app"),
    template: z.literal("waypoint-product-template"),
  }),
});

export const contract = c.router({
  agentContext: c.query().output(agentContextOutputSchema),
  aiGatewayDescription: c.query().output(aiGatewayDescriptionOutputSchema),
  guest: c.query().input(guestInputSchema).output(guestOutputSchema),
  health: c.query().output(healthOutputSchema),
  me: c.query().output(meOutputSchema),
});

export type ApiContract = typeof contract;

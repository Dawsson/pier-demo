import type { z } from "zod";

import { agentContextOutputSchema } from "../contract";
import { publicProcedure } from "../procedures";

type AgentContext = z.infer<typeof agentContextOutputSchema>;

export const buildAgentContext = (generatedAt = new Date().toISOString()): AgentContext => ({
  apps: [
    {
      bindings: [],
      kind: "tanstack-start",
      name: "web",
      vars: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_APP_URL"],
    },
    {
      bindings: ["CACHE", "DB", "INTERNAL"],
      kind: "api-worker",
      name: "api",
      vars: [
        "APP_URL",
        "BETTER_AUTH_SECRET",
        "DEV_API_URL",
        "DEV_WEB_URL",
        "PUBLIC_APP_NAME",
        "PUBLIC_APP_URL",
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
    buildArtifacts:
      'PUBLIC_API_URL=http://127.0.0.1:8787 PUBLIC_APP_NAME="Waypoint Guest" PUBLIC_APP_URL=http://127.0.0.1:5173 APP_URL=http://127.0.0.1:8787 BETTER_AUTH_SECRET=dev-secret bun -e \'import { buildAppArtifact } from "../hosting-platform/packages/app-build/src/index.ts"; const config=(await import("./platform.config.ts")).default; for (const appName of ["api", "web"]) { const artifact=await buildAppArtifact({ config, appName, env: process.env }); console.log(JSON.stringify({ appName, mainModule: artifact.mainModule, modules: artifact.modules.length, staticAssets: artifact.staticAssets?.length ?? 0 })); }\'',
    checkTypes: "bun run check-types",
    dev: ["bun way dev internal", "bun way dev api", "bun way dev web"],
    inspect: "bun ../hosting-platform/packages/cli/src/index.ts inspect platform.config.ts --json",
  },
  billing: {
    commands: {
      assumptions: "bun way billing assumptions --markdown",
      estimate: "bun way billing estimate --markdown",
      scopedEstimate: "bun way billing estimate --project waypoint-guest-app --markdown",
    },
    customerBillable: false,
    mode: "recorded-state-estimate",
    providerMetricsConnected: false,
    warnings: [
      "Recorded-state estimates are for internal review only.",
      "Do not use recorded-state estimates for customer billing.",
      "Connect provider metrics before comparing this template to a Cloudflare invoice.",
    ],
  },
  domains: {
    commands: {
      cleanupPlan: "bun way preview cleanup plan --markdown",
      inspect: "bun way domains inspect --markdown",
      previewTriggerPlan:
        'bun way preview trigger plan --actor Dawsson --body "/waypoint preview" --pr <number> --markdown',
    },
    previewPolicy: {
      allowedActors: ["Dawsson"],
      defaultTtlSeconds: 60 * 60 * 24 * 7,
      requiredCommand: "/waypoint preview",
    },
    readOnly: true,
    warnings: [
      "Domain inspection must not attach routes, create custom domains, or enable previews.",
      "GitHub-triggered previews require Dawsson plus an explicit /waypoint preview command.",
      "Preview cleanup plans are read-only until an operator approves deletion.",
    ],
  },
  generatedAt,
  guardrails: [
    "Do not import API runtime modules into the browser bundle.",
    "Use Better Auth sessions for protected browser queries.",
    "Use generated .waypoint env helpers instead of hand-written env casts.",
    "Use readEventStream or readAiGatewayEventStream for SSE parsing.",
    "Run focused checks after template changes.",
  ],
  logging: {
    events: [
      {
        description: "An AI Gateway example request was described or streamed.",
        name: "ai_gateway.example.requested",
      },
      {
        description: "The API health surface was checked.",
        name: "api.health.checked",
      },
      {
        description: "A guest Better Auth session was created.",
        name: "auth.guest_session.created",
      },
      {
        description: "The guest SSE example accepted a client connection.",
        name: "stream.guest.connected",
      },
    ],
  },
  permissions: {
    catalog: [
      {
        actions: ["read", "manage"],
        description: "Account-level profile, membership, and owner settings.",
        resource: "account",
      },
      {
        actions: ["read", "manage"],
        description: "Project access, deploy visibility, and project operations.",
        resource: "project",
      },
      {
        actions: ["read", "manage"],
        description: "Organization and project settings screens.",
        resource: "settings",
      },
    ],
    roles: [
      {
        description: "Full product owner role for the organization.",
        key: "owner",
        label: "Owner",
        permissions: ["*"],
      },
      {
        description: "Read-only product role for invited collaborators.",
        key: "viewer",
        label: "Viewer",
        permissions: ["account:read", "project:read", "settings:read"],
      },
    ],
  },
  project: {
    name: "waypoint-guest-app",
    template: "waypoint-product-template",
  },
});

export const agentContextQuery = publicProcedure.agentContext.query({
  run: () => buildAgentContext(),
});

import type { z } from "zod";
import { aiGatewayEndpointPlan } from "@waypoint/backend";

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
  backups: {
    commands: {
      drillPlan: "bun way backup drill plan --markdown",
      readiness: "bun way backup readiness --markdown",
      restorePlan: "bun way restore plan <backup-json> --markdown",
    },
    lockedReplica: {
      objectLockExpected: true,
      primaryStorage: "r2",
      replicaStorage: "backblaze-b2",
      remoteVerification: false,
    },
    readOnly: true,
    warnings: [
      "R2 is primary storage; Backblaze B2 is a locked disaster-recovery replica.",
      "Readiness and drill plans must not read Backblaze, write R2, call Cloudflare, or apply restores.",
      "Remote object-lock and replica availability are not verified by template agent context.",
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
  aiGateway: {
    endpointPlan: aiGatewayEndpointPlan({
      accountId: "<cloudflare-account-id>",
      gatewayId: "default",
    }),
    mockStreamingDemo: true,
    warnings: [
      "The template stream demo uses a mock Response and does not call AI Gateway.",
      "New production integrations should use the REST API OpenAI-compatible endpoints from endpointPlan.",
      "Do not log prompts, provider authorization headers, or raw provider payloads.",
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
  localDev: {
    dashboard: {
      logsPath: "/dev/waypoint-guest-app/logs",
      projectPath: "/dev/waypoint-guest-app",
    },
    daemon: {
      mode: "local-machine",
      requiredForLogs: true,
    },
    logCommands: {
      all: "bun way logs --api local --state local --project waypoint-guest-app",
      app: "bun way logs --api local --state local --project waypoint-guest-app --app api",
      dump: "bun way logs dump --api local --state local --project waypoint-guest-app --markdown",
    },
    notes: [
      "way dev sends local process logs to the Waypoint local daemon when it is running.",
      "Use /dev for laptop-only projects and /projects for hosted control-plane projects.",
      "Remote agents should use hosted logs unless they can reach this machine's local daemon.",
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
  responsibilityMap: {
    appOwns: [
      "Product routes, UI, app-specific API procedures, and domain logic.",
      "App-declared bindings, variables, permissions, roles, and event catalog in platform.config.ts.",
      "Browser-safe typed API imports and product-specific tests.",
    ],
    notes: [
      "This repo demonstrates the Waypoint app contract; it is not the platform control plane.",
      "Do not add Cloudflare account mutation, backup replication, billing ingestion, or domain reconciliation code here.",
      "When an app needs those capabilities, call Waypoint CLI/control-plane APIs and keep product code declarative.",
    ],
    waypointOwns: [
      "Dashboard-first platform operations for deployments, logs, usage, billing views, domains, and backups.",
      "Cloudflare API and GraphQL integration for Workers usage, request analytics, R2 storage metrics, and account resources.",
      "Backblaze B2 disaster-recovery backup configuration, readiness checks, retention expectations, and restore plans.",
      "Organization, project, invitation, platform-admin, and RBAC policy enforcement.",
      "Preview URL creation, Dawsson-gated GitHub preview triggers, cleanup policies, and audit logs.",
    ],
  },
});

export const agentContextQuery = publicProcedure.agentContext.query({
  run: () => buildAgentContext(),
});

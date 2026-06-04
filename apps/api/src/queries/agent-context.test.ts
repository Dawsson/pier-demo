import { describe, expect, test } from "bun:test";

import { agentContextOutputSchema } from "../contract";
import { buildAgentContext } from "./agent-context";

describe("agent context", () => {
  test("documents template apps, bindings, guardrails, and commands", () => {
    const context = buildAgentContext("2026-06-04T00:00:00.000Z");

    expect(agentContextOutputSchema.parse(context)).toEqual(context);
    expect(context.project).toEqual({
      name: "waypoint-guest-app",
      template: "waypoint-product-template",
    });
    expect(context.apps.map((app) => app.name)).toEqual(["web", "api", "internal"]);
    expect(context.apps.find((app) => app.name === "api")).toMatchObject({
      bindings: ["CACHE", "DB", "INTERNAL"],
      vars: expect.arrayContaining(["BETTER_AUTH_SECRET", "PUBLIC_APP_URL"]),
    });
    expect(context.commands.checkTypes).toBe("bun run check-types");
    expect(context.commands.inspect).toContain("inspect platform.config.ts --json");
    expect(context.commands.buildArtifacts).toContain("buildAppArtifact");
    expect(context.billing).toMatchObject({
      customerBillable: false,
      mode: "recorded-state-estimate",
      providerMetricsConnected: false,
    });
    expect(context.billing.commands.scopedEstimate).toBe(
      "bun way billing estimate --project waypoint-guest-app --markdown",
    );
    expect(context.billing.warnings).toContain(
      "Do not use recorded-state estimates for customer billing.",
    );
    expect(context.backups).toMatchObject({
      lockedReplica: {
        objectLockExpected: true,
        primaryStorage: "r2",
        remoteVerification: false,
        replicaStorage: "backblaze-b2",
      },
      readOnly: true,
    });
    expect(context.backups.commands.readiness).toBe("bun way backup readiness --markdown");
    expect(context.backups.commands.drillPlan).toBe("bun way backup drill plan --markdown");
    expect(context.backups.warnings).toContain(
      "Readiness and drill plans must not read Backblaze, write R2, call Cloudflare, or apply restores.",
    );
    expect(context.domains).toMatchObject({
      previewPolicy: {
        allowedActors: ["Dawsson"],
        defaultTtlSeconds: 604800,
        requiredCommand: "/waypoint preview",
      },
      readOnly: true,
    });
    expect(context.domains.commands.inspect).toBe("bun way domains inspect --markdown");
    expect(context.domains.commands.previewTriggerPlan).toContain("--actor Dawsson");
    expect(context.domains.warnings).toContain(
      "GitHub-triggered previews require Dawsson plus an explicit /waypoint preview command.",
    );
    expect(context.aiGateway).toMatchObject({
      endpointPlan: {
        chatCompletionsUrl:
          "https://api.cloudflare.com/client/v4/accounts/%3Ccloudflare-account-id%3E/ai/v1/chat/completions",
        openAiCompatibleBaseUrl:
          "https://gateway.ai.cloudflare.com/v1/%3Ccloudflare-account-id%3E/default/openai",
        recommendedEndpoint: "rest-api-openai-compatible",
        responsesUrl:
          "https://api.cloudflare.com/client/v4/accounts/%3Ccloudflare-account-id%3E/ai/v1/responses",
        restApiBaseUrl:
          "https://api.cloudflare.com/client/v4/accounts/%3Ccloudflare-account-id%3E/ai/v1",
        universalDeprecated: true,
        universalUrl: "https://gateway.ai.cloudflare.com/v1/%3Ccloudflare-account-id%3E/default",
      },
      mockStreamingDemo: true,
    });
    expect(context.aiGateway.warnings).toContain(
      "The template stream demo uses a mock Response and does not call AI Gateway.",
    );
    expect(context.logging.events.map((event) => event.name)).toEqual([
      "ai_gateway.example.requested",
      "api.health.checked",
      "auth.guest_session.created",
      "stream.guest.connected",
    ]);
    expect(context.localDev).toEqual({
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
    });
    expect(context.permissions.catalog.map((entry) => entry.resource)).toEqual([
      "account",
      "project",
      "settings",
    ]);
    expect(context.permissions.roles).toEqual([
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
    ]);
    expect(context.guardrails).toContain(
      "Do not import API runtime modules into the browser bundle.",
    );
    expect(context.responsibilityMap.appOwns).toContain(
      "Product routes, UI, app-specific API procedures, and domain logic.",
    );
    expect(context.responsibilityMap.waypointOwns).toEqual([
      "Dashboard-first platform operations for deployments, logs, usage, billing views, domains, and backups.",
      "Cloudflare API and GraphQL integration for Workers usage, request analytics, R2 storage metrics, and account resources.",
      "Backblaze B2 disaster-recovery backup configuration, readiness checks, retention expectations, and restore plans.",
      "Organization, project, invitation, platform-admin, and RBAC policy enforcement.",
      "Preview URL creation, Dawsson-gated GitHub preview triggers, cleanup policies, and audit logs.",
    ]);
    expect(context.responsibilityMap.notes).toContain(
      "Do not add Cloudflare account mutation, backup replication, billing ingestion, or domain reconciliation code here.",
    );
  });
});

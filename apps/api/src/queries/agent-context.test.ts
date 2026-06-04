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
    expect(context.logging.events.map((event) => event.name)).toEqual([
      "ai_gateway.example.requested",
      "api.health.checked",
      "auth.guest_session.created",
      "stream.guest.connected",
    ]);
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
  });
});

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

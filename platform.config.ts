import { app, appSlot, binding, deploy, logging, permissions, roles, variable } from "@pier/core";
import { z } from "zod";

const permissionCatalog = permissions({
  account: ["read", "manage"],
  project: ["read", "manage"],
  settings: ["read", "manage"],
} as const);

export const appPermissions = permissionCatalog.values;

export const appRoles = roles({
  owner: {
    label: "Owner",
    permissions: ["*"],
  },
  viewer: {
    label: "Viewer",
    permissions: ["account:read", "project:read", "settings:read"],
  },
});

export default app({
  name: "pier-demo",
  project: {
    slug: "pier-demo",
  },
  apps: {
    admin: appSlot.tanstackStart("apps/admin/src/start.ts", {
      domain: "admin.pier-demo.buildwithharbor.com",
      vars: ["PUBLIC_ADMIN_URL", "PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
    }),
    api: appSlot.apiWorker("apps/api/src/index.ts", {
      domain: "api.pier-demo.buildwithharbor.com",
      bindings: ["CACHE", "DB", "INTERNAL", "RATE_LIMITER"],
      vars: [
        "ADMIN_URL",
        "API_URL",
        "BETTER_AUTH_SECRET",
        "PUBLIC_ADMIN_URL",
        "PUBLIC_API_URL",
        "PUBLIC_APP_NAME",
        "PUBLIC_WEB_URL",
        "PUBLIC_ZERO_SERVER_SCHEMA",
        "WEB_URL",
      ],
    }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/start.ts", {
      domain: "pier-demo.buildwithharbor.com",
      vars: [
        "PUBLIC_API_URL",
        "PUBLIC_APP_NAME",
        "PUBLIC_WEB_URL",
        "PUBLIC_ZERO_CACHE_URL",
        "PUBLIC_ZERO_SERVER_SCHEMA",
      ],
    }),
  },
  bindings: {
    CACHE: binding.kv(),
    DB: binding.postgres("shared"),
    INTERNAL: binding.worker("internal"),
    RATE_LIMITER: binding.rateLimit("1001", {
      limit: 20,
      period: 60,
    }),
  },
  vars: {
    ADMIN_URL: variable.url(),
    API_URL: variable.url(),
    BETTER_AUTH_SECRET: variable.string().sensitive().random(32),
    PUBLIC_ADMIN_URL: variable.url().public(),
    PUBLIC_API_URL: variable.url().public(),
    PUBLIC_APP_NAME: variable.string().public(),
    PUBLIC_WEB_URL: variable.url().public(),
    PUBLIC_ZERO_CACHE_URL: variable.url().public(),
    PUBLIC_ZERO_SERVER_SCHEMA: variable.string().public(),
    WEB_URL: variable.url(),
  },
  permissions: permissionCatalog,
  logging: logging({
    events: {
      "ai_gateway.example.requested": z.object({
        model: z.string(),
        provider: z.string(),
        streaming: z.boolean(),
      }),
      "api.health.checked": z.object({
        ok: z.boolean(),
        surface: z.literal("api"),
      }),
      "counter.incremented": z.object({
        amount: z.number(),
        authenticated: z.boolean(),
        counter: z.number(),
        identity: z.string(),
      }),
      "rate_limit.checked": z.object({
        allowed: z.boolean(),
        key: z.string(),
        remaining: z.number(),
      }),
      "user.session.checked": z.object({
        authenticated: z.boolean(),
      }),
    },
  }),
  deploy: deploy.localAndGithubActions(),
});

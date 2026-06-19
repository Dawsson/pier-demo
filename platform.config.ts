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
        "DATABASE_URL",
        "PUBLIC_ADMIN_URL",
        "PUBLIC_API_URL",
        "PUBLIC_APP_NAME",
        "PUBLIC_WEB_URL",
        "WEB_URL",
      ],
    }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/start.ts", {
      domain: "pier-demo.buildwithharbor.com",
      vars: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
    }),
  },
  bindings: {
    CACHE: binding.kv(),
    DB: binding.postgres("shared"),
    INTERNAL: binding.worker("internal"),
    RATE_LIMITER: binding.durableObject("RateLimiterObject"),
  },
  deploy: deploy.localAndGithubActions(),
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
  name: "pier-demo",
  permissions: permissionCatalog,
  vars: {
    ADMIN_URL: variable.url().default("https://admin.pier-demo.buildwithharbor.com"),
    API_URL: variable.url().default("https://api.pier-demo.buildwithharbor.com"),
    BETTER_AUTH_SECRET: variable.string().sensitive().random(32),
    DATABASE_URL: variable.string().sensitive(),
    PUBLIC_ADMIN_URL: variable
      .url()
      .default("https://admin.pier-demo.buildwithharbor.com")
      .public(),
    PUBLIC_API_URL: variable.url().default("https://api.pier-demo.buildwithharbor.com").public(),
    PUBLIC_APP_NAME: variable.string().default("Pier Demo"),
    PUBLIC_WEB_URL: variable.url().default("https://pier-demo.buildwithharbor.com").public(),
    WEB_URL: variable.url().default("https://pier-demo.buildwithharbor.com"),
  },
});

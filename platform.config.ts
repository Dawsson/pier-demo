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

const projectOrganizationId = process.env.PIER_ORGANIZATION_ID;

const urls = {
  admin: "https://admin.pier-demo.buildwithharbor.com",
  api: "https://api.pier-demo.buildwithharbor.com",
  web: "https://pier-demo.buildwithharbor.com",
  zeroCache: "https://sync.buildwithharbor.com/pier-demo",
} as const;

const vars = {
  admin: ["PUBLIC_ADMIN_URL", "PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
  api: [
    "ADMIN_URL",
    "API_URL",
    "BETTER_AUTH_SECRET",
    "PUBLIC_ADMIN_URL",
    "PUBLIC_API_URL",
    "PUBLIC_APP_NAME",
    "PUBLIC_WEB_URL",
    "WEB_URL",
  ],
  web: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL", "PUBLIC_ZERO_CACHE_URL"],
} as const;

export default app({
  apps: {
    admin: appSlot.tanstackStart("apps/admin/src/start.ts", {
      domain: new URL(urls.admin).hostname,
      vars: vars.admin,
    }),
    api: appSlot.apiWorker("apps/api/src/index.ts", {
      domain: new URL(urls.api).hostname,
      bindings: ["CACHE", "DB", "INTERNAL", "RATE_LIMITER"],
      vars: vars.api,
    }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/start.ts", {
      domain: new URL(urls.web).hostname,
      vars: vars.web,
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
  ...(projectOrganizationId ? { project: { organizationId: projectOrganizationId } } : {}),
  vars: {
    ADMIN_URL: variable.url().default(urls.admin),
    API_URL: variable.url().default(urls.api),
    BETTER_AUTH_SECRET: variable.string().sensitive().random(32),
    PUBLIC_ADMIN_URL: variable.url().default(urls.admin).public(),
    PUBLIC_API_URL: variable.url().default(urls.api).public(),
    PUBLIC_APP_NAME: variable.string().default("Pier Demo"),
    PUBLIC_WEB_URL: variable.url().default(urls.web).public(),
    PUBLIC_ZERO_CACHE_URL: variable.url().default(urls.zeroCache).public(),
    WEB_URL: variable.url().default(urls.web),
  },
});

import {
  app,
  appSlot,
  binding,
  deploy,
  logging,
  permissions,
  roles,
  variable,
} from "@waypoint/core";
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
    api: appSlot.apiWorker("apps/api/src/index.ts", {
      bindings: ["CACHE", "DB", "INTERNAL"],
      vars: [
        "APP_URL",
        "BETTER_AUTH_SECRET",
        "DEV_API_URL",
        "DEV_WEB_URL",
        "PUBLIC_APP_NAME",
        "PUBLIC_APP_URL",
      ],
    }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/start.ts", {
      vars: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_APP_URL"],
    }),
  },
  bindings: {
    CACHE: binding.kv(),
    DB: binding.d1(),
    INTERNAL: binding.worker("internal"),
  },
  deploy: deploy.localAndGithubActions(),
  logging: logging({
    events: {
      "account.created": z.object({
        accountId: z.string(),
      }),
    },
  }),
  name: "waypoint-guest-app",
  permissions: permissionCatalog,
  vars: {
    APP_URL: variable.string(),
    BETTER_AUTH_SECRET: variable.secret(),
    DEV_API_URL: variable.optionalString(),
    DEV_WEB_URL: variable.optionalString(),
    PUBLIC_API_URL: variable.string().public(),
    PUBLIC_APP_NAME: variable.string(),
    PUBLIC_APP_URL: variable.string().public(),
  },
});

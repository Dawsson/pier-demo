import { app, appSlot, binding, logging, permissions, roles, variable } from "@waypoint/core";
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
    api: appSlot.apiWorker("apps/api/src/index.ts", { bindings: ["CACHE", "DB", "INTERNAL"] }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/start.ts"),
  },
  bindings: {
    CACHE: binding.kv(),
    DB: binding.d1(),
    INTERNAL: binding.worker("internal"),
  },
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
    BETTER_AUTH_SECRET: variable.secret(),
    PUBLIC_APP_NAME: variable.string(),
    PUBLIC_APP_URL: variable.string(),
  },
});

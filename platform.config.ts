import { defaultProcedures } from "@waypoint/backend";
import {
  app,
  appSlot,
  binding,
  controlPlane,
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

const appPermissions = permissionCatalog.values;
const procedures = defaultProcedures();

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
    api: appSlot.apiWorker("apps/api/src/index.ts", { bindings: ["INTERNAL"] }),
    internal: appSlot.internalWorker("apps/internal/src/index.ts", { bindings: ["CACHE"] }),
    web: appSlot.tanstackStart("apps/web/src/index.ts"),
  },
  bindings: {
    CACHE: binding.kv(),
    INTERNAL: binding.worker("internal"),
  },
  controlPlane: controlPlane({
    artifactBucket: "waypoint-artifacts",
    metadataStore: "d1",
    name: "waypoint-control",
    owns: ["apps", "bindings", "deployments", "envVars", "resources", "secrets", "urls"],
  }),
  logging: logging({
    events: {
      "account.created": z.object({
        accountId: z.string(),
      }),
    },
  }),
  name: "waypoint-guest-app",
  permissions: permissionCatalog,
  procedures: {
    account: procedures.account(appPermissions.account.read).define(),
    accountManage: procedures.accountManage(appPermissions.account.manage).define(),
    auth: procedures.auth.define(),
    guest: procedures.guest.define(),
    internal: procedures.internal.define(),
    prodAdmin: procedures.prodAdmin(appPermissions.settings.manage).define(),
    public: procedures.public.define(),
  },
  urls: {
    dev: "generated",
    previews: "generated",
    prod: "guest-app.example.com",
    staging: "staging.guest-app.example.com",
  },
  vars: {
    BETTER_AUTH_SECRET: variable.secret(),
    PUBLIC_APP_NAME: variable.string(),
  },
});


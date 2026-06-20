import type { SyncAuthTokenResult, SyncContext } from "@pier/sync/auth";
import { createProcedureFactory } from "@pier/sync/procedure";
import type { EndpointOperation, OperationTree } from "@pier/sync/rpc";

import { createAccountApi } from "../modules/account/api";
import { createAdminApi } from "../modules/admin/api";
import { createAgentApi } from "../modules/agent/api";
import { createCounterApi } from "../modules/counter/api";
import { createSystemApi } from "../modules/system/api";
import type { DemoSyncContext } from "./context";
import { createDemoSyncBuilder } from "./definition";

type DemoSyncClientAccess = Record<string, never>;

const t = createDemoSyncBuilder();
const endpointProcedure = createProcedureFactory<DemoSyncContext>().procedure;

const syncAuthEndpoint: EndpointOperation<undefined, SyncAuthTokenResult> = {
  kind: "endpoint",
  method: "GET",
  path: "/zero/auth",
  procedure: endpointProcedure,
  run: () => {
    throw new TypeError("Sync auth endpoint descriptors cannot run locally.");
  },
  transport: "http",
};

const routes = t.router({
  account: createAccountApi(t),
  admin: createAdminApi(t),
  agent: createAgentApi(t),
  counter: createCounterApi(t),
  system: createSystemApi(t),
});

const implemented = routes.implement({});

export const operationDefinitions = {
  admin: implemented.definitions.admin,
  agent: implemented.definitions.agent,
  counter: implemented.definitions.counter,
  system: implemented.definitions.system,
  sync: {
    auth: syncAuthEndpoint,
  },
} as const as unknown as OperationTree<DemoSyncContext>;

export const contract = {
  ...implemented,
  clientContext: {
    accessFromToken: (_token: string): DemoSyncClientAccess => ({}),
    create: (user: SyncContext["user"]) => ({
      session: null,
      user,
    }),
    getUserID: (user: SyncContext["user"]) => user?.id ?? null,
  },
  definitions: {
    ...implemented.definitions,
    sync: {
      auth: syncAuthEndpoint,
    },
  },
} as const;

export type ApiContract = typeof contract;

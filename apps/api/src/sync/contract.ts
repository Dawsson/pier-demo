import type { SyncAuthTokenResult, SyncContext } from "@pier/sync/auth";
import { createApiSyncContract } from "@pier/sync/operation-contract";
import { createProcedureFactory } from "@pier/sync/procedure";
import type { EndpointOperation } from "@pier/sync/rpc";

import { createAccountApi } from "#/modules/account/api";
import { contractModules } from "#/contract";
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
});

const implemented = routes.implement({});

export const contract = createApiSyncContract({
  backend: contractModules,
  clientContext: {
    accessFromToken: (_token: string): DemoSyncClientAccess => ({}),
    create: (user: SyncContext["user"]) => ({
      session: null,
      user,
    }),
    getUserID: (user: SyncContext["user"]) => user?.id ?? null,
  },
  extraDefinitions: {
    sync: {
      auth: syncAuthEndpoint,
    },
  },
  sync: implemented,
});

export type ApiContract = typeof contract;

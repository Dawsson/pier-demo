import type { SyncAuthTokenResult, SyncContext } from "@pier/sync/auth";
import { initSync } from "@pier/sync/init";
import { createApiSyncContract } from "@pier/sync/operation-contract";
import { createProcedureFactory } from "@pier/sync/procedure";
import type { EndpointOperation } from "@pier/sync/rpc";

import { contractModules } from "./backend";
import { emptyInputSchema } from "./schemas";
import { schema, zql } from "./sync-schema";

type DemoSyncClientAccess = Record<string, never>;

const t = initSync<typeof schema>().context<SyncContext>().create();
const endpointProcedure = createProcedureFactory<SyncContext>().procedure;

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

const syncContract = t
  .router({
    account: {
      me: t.procedure
        .input(emptyInputSchema)
        .meta({
          description: "Read the current user's profile from the local sync replica.",
          tags: ["account"],
        })
        .sync.query(({ ctx }) => zql.user.where("id", "=", ctx.user?.id ?? "").one()),
    },
  })
  .implement({});

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
  sync: syncContract,
});

export type ApiContract = typeof contract;
export {
  adminSummaryOutputSchema,
  agentContextOutputSchema,
  counterOutputSchema,
  emptyInputSchema,
  healthOutputSchema,
  incrementOutputSchema,
} from "./schemas";

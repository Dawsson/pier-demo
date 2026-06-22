import type { SyncAuthTokenResult, SyncContext } from "@pier/sync/auth";
import { initSync } from "@pier/sync/init";
import { createApiSyncContract } from "@pier/sync/operation-contract";
import { createProcedureFactory } from "@pier/sync/procedure";
import type { EndpointOperation } from "@pier/sync/rpc";

import { contractModules } from "./backend";
import { counterMutationInputSchema, emptyInputSchema } from "./schemas";
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

const syncRouter = t.router({
  account: {
    me: t.procedure
      .input(emptyInputSchema)
      .meta({
        description: "Read the current user's profile from the local sync replica.",
        tags: ["account"],
      })
      .sync.query(({ ctx }) => zql.user.where("id", "=", ctx.user?.id ?? "").one()),
  },
  counter: {
    current: t.procedure
      .input(emptyInputSchema)
      .meta({
        description: "Read the public demo counter from the local sync replica.",
        tags: ["counter"],
      })
      .sync.query(() => zql.counter_state.where("id", "=", "global").one()),
    increment: t.procedure
      .input(counterMutationInputSchema)
      .meta({
        description: "Adjust the demo counter through Pier Sync.",
        tags: ["counter"],
      })
      .sync.mutation(),
  },
});

const syncClientContract = syncRouter.implement({
  counter: {
    increment: async ({ ctx, input, tx }) => {
      const current = await tx.run(zql.counter_state.where("id", "=", "global").one());

      if (!current) {
        return;
      }

      const amount = input?.amount ?? optimisticCounterStep(ctx.user);
      await tx.mutate.counter_state.update({
        id: "global",
        updatedAt: new Date().toISOString(),
        value: current.value + amount,
      });
    },
  },
});

const optimisticCounterStep = (user: SyncContext["user"]) =>
  user && !isAnonymousUser(user) ? 5 : 1;

const isAnonymousUser = (user: unknown) =>
  typeof user === "object" &&
  user !== null &&
  "isAnonymous" in user &&
  (user as { readonly isAnonymous?: unknown }).isAnonymous === true;

const syncContract = {
  clientMutators: syncClientContract.clientMutators,
  definitions: syncRouter.definitions,
  queries: syncRouter.queries,
  serverMutators: {},
};

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
  counterMutationInputSchema,
  counterOutputSchema,
  emptyInputSchema,
  healthOutputSchema,
  syncSessionOutputSchema,
} from "./schemas";
export { syncRouter };

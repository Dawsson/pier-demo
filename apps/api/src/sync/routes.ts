import { createOperationRoutes } from "@pier/sync/rpc";
import { createSyncRoutes } from "@pier/sync/server";
import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";

import { type Env, parseServerEnv } from "../.pier/env";
import { contract, operationDefinitions } from "./contract";
import { createDemoSyncContext, type DemoSyncContext } from "./context";
import { schema } from "./schema";

export const operationRoutes = createOperationRoutes<DemoSyncContext>({
  createContext: createDemoSyncContext,
  operations: operationDefinitions,
});

export const syncRoutes = createSyncRoutes<DemoSyncContext, never, Env>({
  createContext: createDemoSyncContext,
  dbProvider: (context) => zeroDrizzle(schema, context.db as never),
  getUserId: (context) => context.user?.id ?? null,
  mutators: contract.serverMutators,
  queries: contract.queries,
  schema,
  syncAuth: {
    secret: (context) => parseServerEnv(context.env).BETTER_AUTH_SECRET,
  },
});

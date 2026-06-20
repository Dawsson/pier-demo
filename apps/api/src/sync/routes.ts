import { pierSync } from "@pier/sync/server";
import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";

import type { Env } from "#/.pier/env";
import { contract } from "./contract";
import { createDemoSyncContext, type DemoSyncContext } from "./context";
import { schema } from "./schema";

export const apiSyncFeature = pierSync<Env, DemoSyncContext, never>({
  createContext: createDemoSyncContext,
  dbProvider: (context) => zeroDrizzle(schema, context.db as never),
  getUserId: (context) => context.user?.id ?? null,
  mutators: contract.serverMutators,
  queries: contract.queries,
  schema,
  syncAuth: {
    secret: (context) => context.env.BETTER_AUTH_SECRET,
  },
});

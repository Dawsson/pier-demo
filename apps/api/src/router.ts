import { createOperationRoutes } from "@pier/sync/rpc";
import { createSyncRoutes } from "@pier/sync/server";
import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";
import type { Context as HonoContext } from "hono";

import { type Env, parseServerEnv } from "./.pier/env";
import { contract, operationDefinitions, type DemoSyncContext } from "./contract";
import { createApiContext } from "./procedures";
import { schema } from "./sync-schema";

export const createDemoSyncContext = async (
  request: Request,
  context: HonoContext<{ Bindings: Env }>,
): Promise<DemoSyncContext> => {
  const env = parseServerEnv(context.env);
  const baseContext = await createApiContext(env);
  const session = await baseContext.auth.api
    .getSession({ headers: request.headers })
    .catch(() => null);

  return {
    betterAuth: baseContext.auth,
    db: baseContext.db,
    env,
    request,
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
};

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

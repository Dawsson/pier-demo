import type { SyncContext } from "@pier/sync/auth";
import type { Context as HonoContext } from "hono";

import type { Env } from "../.pier/env";
import { parseServerEnv } from "../.pier/env";
import type { AppAuth } from "../auth";
import type { AppDb } from "../db";
import { createApiContext } from "../context";

export type DemoSyncContext = SyncContext & {
  readonly betterAuth: AppAuth;
  readonly db: AppDb;
  readonly env: Env;
  readonly request: Request;
};

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

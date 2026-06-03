import { createApi } from "@waypoint/backend";
import { createAuth } from "./auth";
import { createDb } from "./db";
import type { ApiEnv } from "./env";

export const createApiContext = (env: ApiEnv) => {
  const db = createDb(env);
  const auth = createAuth(env, db);

  return {
    auth,
    db,
  };
};

export type ApiContext = ReturnType<typeof createApiContext>;
export type AuthSession = Awaited<ReturnType<ApiContext["auth"]["api"]["getSession"]>>;

export const api = createApi<ApiEnv>().context<ApiContext>(({ env }) => createApiContext(env));

export const publicProcedure = api.procedure();
export const guestProcedure = api.procedure();

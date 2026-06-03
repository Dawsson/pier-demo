import { createApi } from "@waypoint/backend";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { ensureDatabaseSchema } from "./db/bootstrap";
import type { ApiEnv } from "./env";

export const createApiContext = async (env: ApiEnv) => {
  await ensureDatabaseSchema(env);

  const db = createDb(env);
  const auth = createAuth(env, db);

  return {
    auth,
    db,
  };
};

export type ApiContext = Awaited<ReturnType<typeof createApiContext>>;
export type AuthSession = Awaited<ReturnType<ApiContext["auth"]["api"]["getSession"]>>;

export const api = createApi<ApiEnv>().context<ApiContext>(({ env }) => createApiContext(env));

const requireSession = api.middleware("auth.required", async (ctx) => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return {
    session,
  };
});

export const publicProcedure = api.procedure();
export const guestProcedure = api.procedure();
export const sessionProcedure = api.procedure().use(requireSession);

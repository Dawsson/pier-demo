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

const authMiddleware = (options: { readonly required: boolean }) => api.middleware("auth.session", async (ctx) => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  if (options.required && !session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return {
    session,
  };
});

const permissionMiddleware = api.operationMiddleware("permission", {
  permission: true,
});

export const publicProcedure = api.procedure();
export const guestProcedure = api
  .procedure()
  .use(authMiddleware({ required: false }))
  .use(permissionMiddleware)
  .permission("guest:read");

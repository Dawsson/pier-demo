import { createApi } from "./.pier/api";
import type { Env } from "./.pier/env";
import { createAuth } from "./auth";
import { contract } from "./contract";
import { createDb } from "./db";

export const createApiContext = async (env: Env) => {
  const db = createDb(env);
  const auth = createAuth(env, db);

  return {
    auth,
    db,
  };
};

export type ApiContext = Awaited<ReturnType<typeof createApiContext>>;
export type AuthSession = NonNullable<Awaited<ReturnType<ApiContext["auth"]["api"]["getSession"]>>>;

export const api = createApi().context<ApiContext>(({ env }) => createApiContext(env));
export const procedure = api.implement(contract);

const publicOperation = api.operationMiddleware("auth.public", {
  auth: "public",
});

const optionalSession = api.middleware("auth.optional-session", async (ctx) => {
  if (!ctx.request.headers.get("cookie")) {
    return {
      session: null,
    };
  }

  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);

  return {
    session,
  };
});

const requireSession = api.middleware("auth.required", async (ctx) => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return {
    session,
  };
});

const requireAdmin = api.middleware("auth.admin", async (ctx) => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const role = roleForSession(session);
  if (role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }

  return {
    session,
  };
});

export const publicProcedure = procedure.use(publicOperation).use(optionalSession);
export const sessionProcedure = procedure.use(requireSession);
export const adminProcedure = procedure.use(requireAdmin);

export const roleForSession = (session: AuthSession) => {
  const user = session.user as { readonly role?: unknown };
  return typeof user.role === "string" ? user.role : null;
};

import { healthStatus, PierApiError } from "@pier/backend";
import type { User } from "better-auth";

import { os, type ApiContext } from "./api";
import { counterSnapshotJson } from "./modules/counter/api";
import { enforceCounterRateLimit } from "./modules/counter/rate-limit";
import { incrementCounter, readCounter, recentIncrements } from "./modules/counter/service";

export const routes = os.router({
  admin: {
    summary: os.admin.summary.query(async ({ ctx }) => {
      const user = await requireSessionUser(ctx);
      if (roleForUser(user) !== "admin") {
        throw new PierApiError("FORBIDDEN", {
          message: "Admin access is required.",
          status: 403,
        });
      }

      return {
        counter: counterSnapshotJson(await readCounter(ctx.env.CACHE, { authenticated: true })),
        recentIncrements: (await recentIncrements(ctx.db)).map((increment) => ({
          amount: increment.amount,
          authenticated: increment.authenticated,
          counterValue: increment.counterValue,
          createdAt: increment.createdAt,
          identity: increment.identity,
          userId: increment.userId,
        })),
      };
    }),
  },
  agent: {
    context: os.agent.context.query(() => ({
      apps: [
        {
          bindings: [],
          kind: "tanstack-start",
          name: "web",
          vars: ["PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
        },
        {
          bindings: [],
          kind: "tanstack-start",
          name: "admin",
          vars: ["PUBLIC_ADMIN_URL", "PUBLIC_API_URL", "PUBLIC_APP_NAME", "PUBLIC_WEB_URL"],
        },
        {
          bindings: ["CACHE", "DB", "INTERNAL", "RATE_LIMITER"],
          kind: "api-worker",
          name: "api",
          vars: [
            "ADMIN_URL",
            "API_URL",
            "BETTER_AUTH_SECRET",
            "PUBLIC_ADMIN_URL",
            "PUBLIC_API_URL",
            "PUBLIC_APP_NAME",
            "PUBLIC_WEB_URL",
            "WEB_URL",
          ],
        },
        {
          bindings: ["CACHE"],
          kind: "internal-worker",
          name: "internal",
          vars: [],
        },
      ],
      commands: {
        checkTypes: "bun run check-types",
        dev: "bun run dev",
        inspect: "bun run inspect",
        logs: "pier logs --project pier-demo",
        plan: "bun run plan",
      },
      project: {
        name: "pier-demo" as const,
        template: "pier-counter-template" as const,
      },
    })),
  },
  counter: {
    get: os.counter.get.query(async ({ ctx }) =>
      counterSnapshotJson(
        await readCounter(ctx.env.CACHE, { authenticated: Boolean(await currentSessionUser(ctx)) }),
      ),
    ),
    increment: os.counter.increment.mutation(async ({ ctx }) => {
      const user = await currentSessionUser(ctx);
      const identity = clientIdentity(ctx.request, user?.id);
      await enforceCounterRateLimit(ctx.env, {
        identity,
        operation: "counter.increment",
      });

      const counter = await incrementCounter(ctx.env.CACHE, ctx.db, {
        authenticated: Boolean(user),
        identity,
        ...(user?.id ? { userId: user.id } : {}),
      });

      return {
        ...counterSnapshotJson(counter),
        amount: counter.amount,
      };
    }),
  },
  system: {
    status: os.system.status.endpoint(({ ctx }) =>
      healthStatus({
        app: ctx.env.PUBLIC_APP_NAME,
        checks: {
          auth: { detail: "Better Auth context initialized", ok: Boolean(ctx.auth) },
          db: { detail: "Postgres binding initialized", ok: Boolean(ctx.env.DB) },
          rateLimiter: {
            detail: "Rate limit binding initialized",
            ok: Boolean(ctx.env.RATE_LIMITER),
          },
        },
        surface: "api",
      }),
    ),
  },
});

const currentSessionUser = async (ctx: ApiContext): Promise<User | null> => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  return (session?.user ?? null) as User | null;
};

const requireSessionUser = async (ctx: ApiContext): Promise<User> => {
  const user = await currentSessionUser(ctx);
  if (!user?.id) {
    throw new PierApiError("UNAUTHORIZED", {
      message: "Sign in to continue.",
      status: 401,
    });
  }
  return user;
};

const roleForUser = (user: User) => {
  const role = (user as { readonly role?: unknown }).role;
  return typeof role === "string" ? role : null;
};

const clientIdentity = (request: Request, userId: string | undefined) => {
  if (userId) {
    return `user:${userId}`;
  }

  return `public:${
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "local"
  }`;
};

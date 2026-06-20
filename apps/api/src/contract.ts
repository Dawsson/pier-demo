import { healthStatus } from "@pier/backend";
import {
  requireAuthenticatedSyncContext,
  type SyncAuthTokenResult,
  type SyncContext,
} from "@pier/sync/auth";
import { forbidden } from "@pier/sync";
import { initSync } from "@pier/sync/init";
import { createProcedureFactory } from "@pier/sync/procedure";
import type { EndpointOperation, OperationTree } from "@pier/sync/rpc";
import type { ReadonlyJSONValue } from "@rocicorp/zero";
import type { User } from "better-auth";
import { z } from "zod";

import { incrementCounter, readCounter, recentIncrements } from "./counter";
import type { Env } from "./.pier/env";
import type { AppAuth } from "./auth";
import type { AppDb } from "./db";
import { schema, zql } from "./sync-schema";
import { checkRateLimit } from "./rate-limit";

export type DemoSyncContext = SyncContext & {
  readonly betterAuth: AppAuth;
  readonly db: AppDb;
  readonly env: Env;
  readonly request: Request;
};

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  multiplier: z.number(),
  updatedAt: z.string(),
  value: z.number(),
});

export const incrementOutputSchema = counterOutputSchema.extend({
  amount: z.number(),
});

export const adminSummaryOutputSchema = z.object({
  counter: counterOutputSchema,
  recentIncrements: z.array(
    z.object({
      amount: z.number(),
      authenticated: z.boolean(),
      counterValue: z.number(),
      createdAt: z.string(),
      identity: z.string(),
      userId: z.string().nullable(),
    }),
  ),
});

export const healthOutputSchema = z.object({
  app: z.string(),
  checks: z.record(
    z.string(),
    z.object({
      detail: z.string().optional(),
      ok: z.boolean(),
    }),
  ),
  generatedAt: z.string(),
  ok: z.boolean(),
  surface: z.literal("api"),
});

type JsonObject = {
  readonly [key: string]: ReadonlyJSONValue | undefined;
};

type AuthSessionOutput = {
  readonly session?: JsonObject | null;
  readonly user?:
    | (JsonObject & {
        readonly id: string;
        readonly role?: string | undefined;
      })
    | null;
} | null;

export const authSessionOutputSchema = z.custom<AuthSessionOutput>();

export const agentContextOutputSchema = z.object({
  apps: z.array(
    z.object({
      bindings: z.array(z.string()),
      kind: z.string(),
      name: z.string(),
      vars: z.array(z.string()),
    }),
  ),
  commands: z.object({
    checkTypes: z.string(),
    dev: z.string(),
    inspect: z.string(),
    logs: z.string(),
    plan: z.string(),
  }),
  project: z.object({
    name: z.literal("pier-demo"),
    template: z.literal("pier-counter-template"),
  }),
});

type DemoSyncClientAccess = Record<string, never>;
const t = initSync<typeof schema>().context<DemoSyncContext>().create();
const endpointProcedure = createProcedureFactory<DemoSyncContext>().procedure;
const emptyInput = z.object({}).optional();
const counterLimit = 20;
const counterWindowSeconds = 60;

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

const routes = t.router({
  account: {
    me: t.procedure
      .input(emptyInput)
      .meta({
        description: "Read the current user's profile from the local sync replica.",
        tags: ["account"],
      })
      .sync.query(({ ctx }) => zql.user.where("id", "=", ctx.user?.id ?? "").one()),
  },
  admin: {
    summary: t.procedure
      .input(emptyInput)
      .output(adminSummaryOutputSchema)
      .meta({
        description: "Read the admin summary through the RPC transport.",
        tags: ["admin"],
      })
      .rpc.query(async ({ ctx }) => {
        const authContext = requireAuthenticatedSyncContext(ctx);
        if (roleForUser(authContext.user) !== "admin") {
          throw forbidden("Admin access is required.");
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
    context: t.procedure
      .input(emptyInput)
      .output(agentContextOutputSchema)
      .meta({
        description: "Returns agent-readable wiring for the counter template.",
        tags: ["agent"],
      })
      .rpc.query(() => ({
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
  auth: {
    session: t.procedure
      .input(emptyInput)
      .output(authSessionOutputSchema)
      .meta({
        description: "Read the current Better Auth session through the RPC transport.",
        tags: ["auth"],
      })
      .rpc.query(async ({ ctx }) =>
        authSessionJson(await ctx.betterAuth.api.getSession({ headers: ctx.request.headers })),
      ),
  },
  counter: {
    get: t.procedure
      .input(emptyInput)
      .output(counterOutputSchema)
      .meta({
        description: "Read the demo counter through the RPC transport.",
        tags: ["counter"],
      })
      .rpc.query(async ({ ctx }) =>
        counterSnapshotJson(await readCounter(ctx.env.CACHE, { authenticated: Boolean(ctx.user) })),
      ),
    increment: t.procedure
      .input(emptyInput)
      .output(incrementOutputSchema)
      .meta({
        description: "Increment the demo counter through the RPC transport.",
        tags: ["counter"],
      })
      .rpc.mutation(async ({ ctx, request }) => {
        const identity = clientIdentity(request, ctx.user?.id);
        const rateLimit = await checkRateLimit(ctx.env, {
          identity,
          operation: "counter.increment",
        });

        if (!rateLimit.allowed) {
          throw new Response("Too many counter increments.", {
            headers: {
              "RateLimit-Limit": String(counterLimit),
              "RateLimit-Policy": `${counterLimit};w=${counterWindowSeconds}`,
              "RateLimit-Remaining": String(rateLimit.remaining),
              "RateLimit-Reset": secondsUntil(rateLimit.resetAt),
            },
            status: 429,
          });
        }

        const counter = await incrementCounter(ctx.env.CACHE, ctx.db, {
          authenticated: Boolean(ctx.user),
          identity,
          ...(ctx.user?.id ? { userId: ctx.user.id } : {}),
        });

        return {
          ...counterSnapshotJson(counter),
          amount: counter.amount,
        };
      }),
  },
  system: {
    status: t.procedure
      .input(emptyInput)
      .output(healthOutputSchema)
      .meta({
        description: "Read API health through a normal typed HTTP endpoint.",
        tags: ["system"],
      })
      .endpoint({ method: "GET", path: "/status" })
      .handler(({ ctx }) =>
        Response.json(
          healthStatus({
            app: ctx.env.PUBLIC_APP_NAME,
            checks: {
              auth: { detail: "Better Auth context initialized", ok: Boolean(ctx.betterAuth) },
              db: { detail: "Postgres binding initialized", ok: Boolean(ctx.env.DB) },
              rateLimiter: {
                detail: "Durable Object binding initialized",
                ok: Boolean(ctx.env.RATE_LIMITER),
              },
            },
            surface: "api",
          }),
        ),
      ),
  },
});

const implemented = routes.implement({});

export const operationDefinitions = {
  admin: implemented.definitions.admin,
  agent: implemented.definitions.agent,
  auth: implemented.definitions.auth,
  counter: implemented.definitions.counter,
  system: implemented.definitions.system,
  sync: {
    auth: syncAuthEndpoint,
  },
} as const as unknown as OperationTree<DemoSyncContext>;

export const contract = {
  ...implemented,
  clientContext: {
    accessFromToken: (_token: string): DemoSyncClientAccess => ({}),
    create: (user: SyncContext["user"]) => ({
      session: null,
      user,
    }),
    getUserID: (user: SyncContext["user"]) => user?.id ?? null,
  },
  definitions: {
    ...implemented.definitions,
    sync: {
      auth: syncAuthEndpoint,
    },
  },
} as const;

export type ApiContract = typeof contract;

const roleForUser = (user: User) => {
  const role = (user as { readonly role?: unknown }).role;
  return typeof role === "string" ? role : null;
};

const secondsUntil = (timestamp: string) =>
  String(Math.max(Math.ceil((Date.parse(timestamp) - Date.now()) / 1000), 0));

const authSessionJson = (session: unknown): AuthSessionOutput =>
  JSON.parse(JSON.stringify(session)) as AuthSessionOutput;

const counterSnapshotJson = (counter: {
  readonly authenticated: boolean;
  readonly multiplier: number;
  readonly updatedAt: string;
  readonly value: number;
}) => ({
  authenticated: counter.authenticated,
  multiplier: counter.multiplier,
  updatedAt: counter.updatedAt,
  value: counter.value,
});

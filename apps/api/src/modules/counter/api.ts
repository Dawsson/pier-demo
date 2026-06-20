import { z } from "zod";

import { emptyInput, type DemoSyncBuilder } from "../../sync/definition";
import { checkRateLimit } from "./rate-limit";
import { incrementCounter, readCounter, type CounterSnapshot } from "./service";

const counterLimit = 20;
const counterWindowSeconds = 60;

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  multiplier: z.number(),
  updatedAt: z.string(),
  value: z.number(),
});

export const incrementOutputSchema = counterOutputSchema.extend({
  amount: z.number(),
});

export const createCounterApi = (t: DemoSyncBuilder) => ({
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
});

export const counterSnapshotJson = (counter: CounterSnapshot) => ({
  authenticated: counter.authenticated,
  multiplier: counter.multiplier,
  updatedAt: counter.updatedAt,
  value: counter.value,
});

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

const secondsUntil = (timestamp: string) =>
  String(Math.max(Math.ceil((Date.parse(timestamp) - Date.now()) / 1000), 0));

import { z } from "zod";

import { emptyInput, type DemoSyncBuilder } from "#/sync/definition";
import { enforceCounterRateLimit } from "./rate-limit";
import { incrementCounter, readCounter, type CounterSnapshot } from "./service";

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  step: z.number(),
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
      counterSnapshotJson(await readCounter(ctx.db, { authenticated: Boolean(ctx.user) })),
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
      await enforceCounterRateLimit(ctx.env, {
        identity,
        operation: "counter.increment",
      });

      const counter = await incrementCounter(ctx.db, {
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
  step: counter.step,
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

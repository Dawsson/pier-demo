import { counterOutputSchema } from "@pier-demo/api-contract";
import type { z } from "zod";
import { currentSessionUser } from "#/auth/session";
import { os } from "#/api";
import { enforceCounterRateLimit } from "./rate-limit";
import { incrementCounter } from "./service";

type CounterSnapshotJson = z.infer<typeof counterOutputSchema>;

export const counterRoutes = {
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
};

export const counterSnapshotJson = (counter: {
  readonly authenticated: boolean;
  readonly step: number;
  readonly updatedAt: string;
  readonly value: number;
}): CounterSnapshotJson => ({
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

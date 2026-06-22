import { os } from "#/api";
import { enforceCounterRateLimit } from "#/modules/counter/rate-limit";
import { incrementCounter, readCounter } from "#/modules/counter/service";
import { counterSnapshotJson } from "#/modules/counter/snapshot";

export const counterRoutes = {
  adjust: os.publicCounter.adjust.mutation({
    auth: "public",
    run: async ({ ctx, input }) => {
      const identity = counterIdentity(ctx.request);

      await enforceCounterRateLimit(ctx.env, {
        identity,
        operation: "publicCounter.adjust",
      });

      return counterSnapshotJson(
        await incrementCounter(ctx.db, {
          amount: input.amount,
          authenticated: false,
          identity,
        }),
      );
    },
  }),
  current: os.publicCounter.current.query({
    auth: "public",
    run: async ({ ctx }) =>
      counterSnapshotJson(await readCounter(ctx.db, { authenticated: false })),
  }),
};

const counterIdentity = (request: Request) =>
  `public:${
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "local"
  }`;

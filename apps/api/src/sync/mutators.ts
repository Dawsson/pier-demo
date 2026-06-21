import { syncRouter } from "@pier-demo/api-contract";
import { enforceCounterRateLimit } from "#/modules/counter/rate-limit";
import { incrementCounter } from "#/modules/counter/service";
import type { DemoSyncContext } from "./context";

export const syncMutators = syncRouter.implement({
  counter: {
    increment: async ({ ctx }) => {
      const appContext = ctx as DemoSyncContext;
      const identity = counterIdentity(appContext.request, appContext.user?.id);

      await enforceCounterRateLimit(appContext.env, {
        identity,
        operation: "counter.increment",
      });

      await incrementCounter(appContext.env.CACHE, appContext.db, {
        authenticated: Boolean(appContext.user),
        identity,
        ...(appContext.user?.id ? { userId: appContext.user.id } : {}),
      });
    },
  },
});

const counterIdentity = (request: Request, userId: string | undefined) => {
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

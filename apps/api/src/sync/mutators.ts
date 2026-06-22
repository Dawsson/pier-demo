import { syncRouter } from "@pier-demo/api-contract";
import { enforceCounterRateLimit } from "#/modules/counter/rate-limit";
import { incrementCounter } from "#/modules/counter/service";
import type { DemoSyncContext } from "./context";

export const syncMutators = syncRouter.implement({
  counter: {
    increment: async ({ ctx, input }) => {
      const appContext = ctx as DemoSyncContext;
      const identity = counterIdentity(appContext.request, appContext.user?.id);
      const authenticated = Boolean(appContext.user) && !isAnonymousUser(appContext.user);

      await enforceCounterRateLimit(appContext.env, {
        identity,
        operation: "counter.increment",
      });

      await incrementCounter(appContext.db, {
        authenticated,
        identity,
        ...(input?.amount !== undefined ? { amount: input.amount } : {}),
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

const isAnonymousUser = (user: unknown) =>
  typeof user === "object" &&
  user !== null &&
  "isAnonymous" in user &&
  (user as { readonly isAnonymous?: unknown }).isAnonymous === true;

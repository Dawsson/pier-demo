import { syncRouter } from "@pier-demo/api-contract";
import { sql } from "drizzle-orm";
import type { AppDb } from "#/db";
import { counterIncrement, counterState } from "#/db/schema";
import { enforceCounterRateLimit } from "#/modules/counter/rate-limit";
import { counterStep } from "#/modules/counter/service";
import type { DemoSyncContext } from "./context";

export const syncMutators = syncRouter.implement({
  counter: {
    increment: async ({ ctx, input, tx }) => {
      const appContext = ctx as DemoSyncContext;
      const identity = counterIdentity(appContext.request, appContext.user?.id);
      const authenticated = Boolean(appContext.user) && !isAnonymousUser(appContext.user);
      const amount = input?.amount ?? counterStep(authenticated);

      await enforceCounterRateLimit(appContext.env, {
        identity,
        operation: "counter.increment",
      });

      if (tx.location !== "server") {
        throw new Error("Counter increment must run on the server.");
      }

      const db = tx.dbTransaction.wrappedTransaction as AppDb;
      const now = new Date().toISOString();
      const [counter] = await db
        .insert(counterState)
        .values({
          id: "global",
          updatedAt: now,
          value: amount,
        })
        .onConflictDoUpdate({
          set: {
            updatedAt: now,
            value: sql`${counterState.value} + ${amount}`,
          },
          target: counterState.id,
        })
        .returning();

      await db.insert(counterIncrement).values({
        amount,
        authenticated,
        counterValue: counter?.value ?? amount,
        createdAt: new Date(now),
        id: crypto.randomUUID(),
        identity,
        userId: appContext.user?.id ?? null,
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

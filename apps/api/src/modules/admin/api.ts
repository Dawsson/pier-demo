import { PierApiError } from "@pier/backend";
import { requireSessionUser, roleForUser } from "#/auth/session";
import { os } from "#/api";
import { readCounter, recentIncrements } from "#/modules/counter/service";
import { counterSnapshotJson } from "#/modules/counter/snapshot";

export const adminRoutes = {
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
};

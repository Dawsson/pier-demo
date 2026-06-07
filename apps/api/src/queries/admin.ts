import { readCounter, recentIncrements } from "../counter";
import { adminProcedure } from "../procedures";

export const adminSummaryQuery = adminProcedure.admin.summary.query({
  run: async ({ ctx }) => ({
    counter: await readCounter(ctx.env.CACHE, { authenticated: true }),
    recentIncrements: await recentIncrements(ctx.db),
  }),
});

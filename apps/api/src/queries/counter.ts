import { readCounter } from "../counter";
import { publicProcedure } from "../procedures";

export const counterGetQuery = publicProcedure.counter.get.query({
  run: ({ ctx }) => readCounter(ctx.env.CACHE, { authenticated: Boolean(ctx.session) }),
});

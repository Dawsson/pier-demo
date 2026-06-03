import { z } from "zod";
import { guestProcedure } from "../procedures";

export const guestQuery = guestProcedure.query({
  input: z
    .object({
      id: z.string().default("guest"),
    })
    .optional()
    .default({ id: "guest" }),

  run: async (ctx, input) => {
    const db = ctx.db;
    const [user, sum] = await Promise.all([
      ctx.env.INTERNAL.getUser(input.id),
      ctx.env.INTERNAL.add(2, 3),
    ]);

    return {
      auth: "guest",
      internal: {
        sum,
        user,
      },
      message: "Guest access is enabled.",
      operation: ctx.operation.name,
      services: {
        db: Boolean(db),
      },
    };
  },
});

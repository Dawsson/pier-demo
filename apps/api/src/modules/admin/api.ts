import { z } from "zod";

import { counterOutputSchema } from "#/modules/counter/api";

export const adminSummaryOutputSchema = z.object({
  counter: counterOutputSchema,
  recentIncrements: z.array(
    z.object({
      amount: z.number(),
      authenticated: z.boolean(),
      counterValue: z.number(),
      createdAt: z.string(),
      identity: z.string(),
      userId: z.string().nullable(),
    }),
  ),
});

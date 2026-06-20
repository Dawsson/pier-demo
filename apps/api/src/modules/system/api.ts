import { z } from "zod";

export const healthOutputSchema = z.object({
  app: z.string(),
  checks: z.record(
    z.string(),
    z.object({
      detail: z.string().optional(),
      ok: z.boolean(),
    }),
  ),
  generatedAt: z.string(),
  ok: z.boolean(),
  surface: z.literal("api"),
});

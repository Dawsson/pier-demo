import { contractBuilder as c } from "@waypoint/backend";
import { z } from "zod";

export const guestInputSchema = z
  .object({
    id: z.string().default("guest"),
  })
  .optional()
  .default({ id: "guest" });

export const guestOutputSchema = z.object({
  auth: z.literal("guest"),
  cache: z.object({
    key: z.string(),
    seenAt: z.string().nullable(),
  }),
  internal: z.object({
    sum: z.number(),
    user: z.unknown(),
  }),
  message: z.string(),
  operation: z.string(),
  services: z.object({
    db: z.boolean(),
  }),
});

export const healthOutputSchema = z.object({
  app: z.string(),
  ok: z.literal(true),
  surface: z.literal("api"),
});

export const meOutputSchema = z.object({
  mode: z.enum(["anonymous", "user"]),
  sessionId: z.string(),
  user: z.object({
    email: z.string().nullable().optional(),
    id: z.string(),
    isAnonymous: z.boolean(),
    name: z.string().nullable().optional(),
  }),
});

export const contract = c.router({
  guest: c.query().input(guestInputSchema).output(guestOutputSchema),
  health: c.query().output(healthOutputSchema),
  me: c.query().output(meOutputSchema),
});

export type ApiContract = typeof contract;

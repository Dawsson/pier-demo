import { forbidden } from "@pier/sync";
import { requireAuthenticatedSyncContext } from "@pier/sync/auth";
import type { User } from "better-auth";
import { z } from "zod";

import { counterOutputSchema, counterSnapshotJson } from "../counter/api";
import { readCounter, recentIncrements } from "../counter/service";
import { emptyInput, type DemoSyncBuilder } from "../../sync/definition";

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

export const createAdminApi = (t: DemoSyncBuilder) => ({
  summary: t.procedure
    .input(emptyInput)
    .output(adminSummaryOutputSchema)
    .meta({
      description: "Read the admin summary through the RPC transport.",
      tags: ["admin"],
    })
    .rpc.query(async ({ ctx }) => {
      const authContext = requireAuthenticatedSyncContext(ctx);
      if (roleForUser(authContext.user) !== "admin") {
        throw forbidden("Admin access is required.");
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
});

const roleForUser = (user: User) => {
  const role = (user as { readonly role?: unknown }).role;
  return typeof role === "string" ? role : null;
};

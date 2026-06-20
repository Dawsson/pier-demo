import { emptyInput, type DemoSyncBuilder } from "#/sync/definition";
import { zql } from "#/sync/schema";

export const createAccountApi = (t: DemoSyncBuilder) => ({
  me: t.procedure
    .input(emptyInput)
    .meta({
      description: "Read the current user's profile from the local sync replica.",
      tags: ["account"],
    })
    .sync.query(({ ctx }) => zql.user.where("id", "=", ctx.user?.id ?? "").one()),
});

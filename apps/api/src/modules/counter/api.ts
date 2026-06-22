import { os } from "#/api";
import { readCounter } from "#/modules/counter/service";
import { counterSnapshotJson } from "#/modules/counter/snapshot";

export const counterRoutes = {
  current: os.publicCounter.current.query({
    auth: "public",
    run: async ({ ctx }) =>
      counterSnapshotJson(await readCounter(ctx.db, { authenticated: false })),
  }),
};

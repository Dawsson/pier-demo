import { publicProcedure } from "../procedures";

export const healthEndpoint = publicProcedure.health.query({
  run: ({ ctx }) =>
    ({
      app: ctx.env.PUBLIC_APP_NAME,
      ok: true,
      surface: "api",
    }),
});

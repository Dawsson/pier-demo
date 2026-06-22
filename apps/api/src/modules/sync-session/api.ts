import { createSyncAuthTokenResult } from "@pier/sync";
import { os } from "#/api";

export const syncSessionRoutes = {
  current: os.syncSession.current.endpoint({
    auth: "public",
    run: async ({ ctx }) => {
      const request = ctx.request;
      const session = await ctx.auth.api.getSession({ headers: request.headers }).catch(() => null);
      const user = session?.user ?? null;

      if (!user) {
        return Response.json(
          {
            error: {
              message: "No active session.",
              status: 401,
            },
            ok: false,
          },
          { status: 401 },
        );
      }

      const auth = await createSyncAuthTokenResult(user.id, {
        secret: ctx.env.BETTER_AUTH_SECRET,
      });

      return Response.json({
        auth,
        user,
      });
    },
  }),
};

import { publicProcedure, roleForSession } from "../procedures";

export const meQuery = publicProcedure.account.me.query({
  run: ({ ctx }) => {
    if (!ctx.session) {
      return {
        authenticated: false,
      };
    }

    return {
      authenticated: true,
      sessionId: ctx.session.session.id,
      user: {
        email: ctx.session.user.email,
        id: ctx.session.user.id,
        name: ctx.session.user.name,
        role: roleForSession(ctx.session),
      },
    };
  },
});

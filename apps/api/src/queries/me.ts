import { sessionProcedure } from "../procedures";

export const meQuery = sessionProcedure.query({
  run: (ctx) => {
    const isAnonymous = "isAnonymous" in ctx.session.user && ctx.session.user.isAnonymous === true;

    return {
      mode: isAnonymous ? "anonymous" : "user",
      sessionId: ctx.session.session.id,
      user: {
        email: ctx.session.user.email,
        id: ctx.session.user.id,
        isAnonymous,
        name: ctx.session.user.name,
      },
    };
  },
});

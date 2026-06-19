import { incrementCounter } from "../counter";
import { publicProcedure } from "../procedures";
import { checkRateLimit } from "../rate-limit";

const counterLimit = 20;
const counterWindowSeconds = 60;

const clientIdentity = (request: Request, userId: string | undefined) => {
  if (userId) {
    return `user:${userId}`;
  }

  return `public:${
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "local"
  }`;
};

export const counterIncrementMutation = publicProcedure.counter.increment.mutation({
  run: async ({ ctx }) => {
    const identity = clientIdentity(ctx.request, ctx.session?.user.id);
    const rateLimit = await checkRateLimit(ctx.env, {
      identity,
      operation: "counter.increment",
    });

    ctx.response.setHeader("RateLimit-Limit", String(counterLimit));
    ctx.response.setHeader("RateLimit-Policy", `${counterLimit};w=${counterWindowSeconds}`);
    ctx.response.setHeader("RateLimit-Remaining", String(rateLimit.remaining));
    ctx.response.setHeader("RateLimit-Reset", secondsUntil(rateLimit.resetAt));

    if (!rateLimit.allowed) {
      throw new Response("Too many counter increments.", {
        headers: Object.fromEntries(ctx.response.headers.entries()),
        status: 429,
      });
    }

    const counter = await incrementCounter(ctx.env.CACHE, ctx.db, {
      authenticated: Boolean(ctx.session),
      identity,
      ...(ctx.session?.user.id ? { userId: ctx.session.user.id } : {}),
    });

    return counter;
  },
});

const secondsUntil = (timestamp: string) =>
  String(Math.max(Math.ceil((Date.parse(timestamp) - Date.now()) / 1000), 0));

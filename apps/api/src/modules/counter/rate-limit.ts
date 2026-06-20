import type { Env } from "#/.pier/env";

const counterLimit = 20;
const counterWindowSeconds = 60;

export const enforceCounterRateLimit = async (
  env: Env,
  input: { readonly identity: string; readonly operation: string },
): Promise<void> => {
  const key = `${input.operation}:${input.identity}`;
  const { success } = await env.RATE_LIMITER.limit({ key });

  if (!success) {
    throw new Response("Too many counter increments.", {
      headers: {
        "RateLimit-Limit": String(counterLimit),
        "RateLimit-Policy": `${counterLimit};w=${counterWindowSeconds}`,
      },
      status: 429,
    });
  }
};

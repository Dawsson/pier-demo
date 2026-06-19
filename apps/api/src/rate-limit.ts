import type { Env } from "./.pier/env";
import type { RateLimitDecision } from "./rate-limiter";

export const checkRateLimit = async (
  env: Env,
  input: { readonly identity: string; readonly operation: string },
): Promise<RateLimitDecision> => {
  const key = `${input.operation}:${input.identity}`;
  const id = env.RATE_LIMITER.idFromName(key);
  const response = await env.RATE_LIMITER.get(id).fetch("https://rate-limit.local/rpc/check", {
    body: JSON.stringify({
      key,
      limit: 20,
      windowMs: 60_000,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  const body = await response.json<{
    readonly ok?: boolean;
    readonly result?: RateLimitDecision;
  }>();
  if (!response.ok || !body.ok || !body.result) {
    throw new Response("Rate limit check failed.", { status: 503 });
  }

  return body.result;
};

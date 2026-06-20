import type { Env } from "#/.pier/env";

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: string;
}

interface RateLimitBinding {
  limit(input: { readonly key: string }): Promise<{ readonly success: boolean }>;
}

export const checkRateLimit = async (
  env: Env,
  input: { readonly identity: string; readonly operation: string },
): Promise<RateLimitDecision> => {
  const key = `${input.operation}:${input.identity}`;
  const { success } = await (env.RATE_LIMITER as unknown as RateLimitBinding).limit({ key });

  return {
    allowed: success,
    remaining: success ? 19 : 0,
    resetAt: new Date(Date.now() + 60_000).toISOString(),
  };
};

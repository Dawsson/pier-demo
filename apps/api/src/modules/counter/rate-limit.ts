import { validationError } from "@pier/sync/errors";
import type { Env } from "#/.pier/env";

const counterWindowSeconds = 60;

export const enforceCounterRateLimit = async (
  env: Env,
  input: { identity: string; operation: string },
): Promise<void> => {
  const key = `${input.operation}:${input.identity}`;

  const { success } = await env.RATE_LIMITER.limit({ key });

  if (!success) {
    throw validationError(
      `Too many counter increments. Try again in about ${counterWindowSeconds} seconds.`,
    );
  }
};

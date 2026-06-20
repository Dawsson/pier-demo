import { z } from "zod";
import { PierObject } from "@pier/backend";
import type { Env } from "../../.pier/env";

const limitInputSchema = z.object({
  key: z.string().min(1),
  limit: z.number().int().positive().default(20),
  windowMs: z.number().int().positive().default(60_000),
});

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: string;
}

interface RateLimitBucket {
  readonly count: number;
  readonly resetAt: number;
}

export class RateLimiterObject extends PierObject<Env> {
  check = this.method()
    .input(limitInputSchema)
    .internal()
    .handle<RateLimitDecision>(async ({ input }) => {
      const now = Date.now();
      const key = `limit:${input.key}`;
      const current = (await this.ctx.storage.get<RateLimitBucket>(key)) ?? {
        count: 0,
        resetAt: now + input.windowMs,
      };
      const bucket = current.resetAt <= now ? { count: 0, resetAt: now + input.windowMs } : current;
      const nextCount = bucket.count + 1;
      const allowed = nextCount <= input.limit;

      await this.ctx.storage.put<RateLimitBucket>(key, {
        count: nextCount,
        resetAt: bucket.resetAt,
      });

      return {
        allowed,
        remaining: Math.max(input.limit - nextCount, 0),
        resetAt: new Date(bucket.resetAt).toISOString(),
      };
    });
}

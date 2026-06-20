import { z } from "zod";

import type { CounterSnapshot } from "./service";

export const counterOutputSchema = z.object({
  authenticated: z.boolean(),
  step: z.number(),
  updatedAt: z.string(),
  value: z.number(),
});

export const incrementOutputSchema = counterOutputSchema.extend({
  amount: z.number(),
});

export const counterSnapshotJson = (counter: CounterSnapshot) => ({
  authenticated: counter.authenticated,
  step: counter.step,
  updatedAt: counter.updatedAt,
  value: counter.value,
});

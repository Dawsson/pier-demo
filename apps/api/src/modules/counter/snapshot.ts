import { counterOutputSchema } from "@pier-demo/api-contract";
import type { z } from "zod";

type CounterSnapshotJson = z.infer<typeof counterOutputSchema>;

export const counterSnapshotJson = (counter: {
  readonly authenticated: boolean;
  readonly step: number;
  readonly updatedAt: string;
  readonly value: number;
}): CounterSnapshotJson => ({
  authenticated: counter.authenticated,
  step: counter.step,
  updatedAt: counter.updatedAt,
  value: counter.value,
});

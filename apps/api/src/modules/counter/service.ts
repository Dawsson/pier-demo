import { desc } from "drizzle-orm";
import type { AppDb } from "#/db";
import { counterIncrement } from "#/db/schema";

const counterKey = "counter:global";
const recentIncrementLimit = 20;
const publicStep = 1;
const authenticatedStep = 5;

export interface CounterSnapshot {
  authenticated: boolean;
  step: number;
  updatedAt: string;
  value: number;
}

export interface CounterIncrement {
  amount: number;
  authenticated: boolean;
  counterValue: number;
  createdAt: string;
  identity: string;
  userId: string | null;
}

export type IncrementCounterInput = {
  authenticated: boolean;
  identity: string;
  userId?: string;
};

export type IncrementCounterResult = CounterSnapshot & {
  amount: number;
};

export const counterStep = (authenticated: boolean) =>
  authenticated ? authenticatedStep : publicStep;

export const readCounter = async (
  kv: KVNamespace,
  input: { authenticated: boolean },
): Promise<CounterSnapshot> => {
  const counter = await readCounterValue(kv);

  return {
    authenticated: input.authenticated,
    step: counterStep(input.authenticated),
    updatedAt: counter.updatedAt,
    value: counter.value,
  };
};

export const incrementCounter = async (
  kv: KVNamespace,
  db: AppDb,
  input: IncrementCounterInput,
) => {
  const amount = counterStep(input.authenticated);
  const now = new Date().toISOString();
  const current = await readCounterValue(kv);
  const next = {
    updatedAt: now,
    value: current.value + amount,
  };

  await kv.put(counterKey, JSON.stringify(next));
  await db.insert(counterIncrement).values({
    amount,
    authenticated: input.authenticated,
    counterValue: next.value,
    createdAt: new Date(now),
    id: crypto.randomUUID(),
    identity: input.identity,
    userId: input.userId ?? null,
  });

  return {
    amount,
    authenticated: input.authenticated,
    step: amount,
    updatedAt: next.updatedAt,
    value: next.value,
  };
};

export const recentIncrements = async (db: AppDb): Promise<CounterIncrement[]> => {
  const rows = await db
    .select({
      amount: counterIncrement.amount,
      authenticated: counterIncrement.authenticated,
      counterValue: counterIncrement.counterValue,
      createdAt: counterIncrement.createdAt,
      identity: counterIncrement.identity,
      userId: counterIncrement.userId,
    })
    .from(counterIncrement)
    .orderBy(desc(counterIncrement.createdAt))
    .limit(recentIncrementLimit);

  return rows.map((row) => ({
    amount: row.amount,
    authenticated: row.authenticated,
    counterValue: row.counterValue,
    createdAt: isoTimestamp(row.createdAt),
    identity: row.identity,
    userId: row.userId,
  }));
};

const isoTimestamp = (value: Date | string | undefined) =>
  value instanceof Date ? value.toISOString() : (value ?? new Date().toISOString());

const readCounterValue = async (kv: KVNamespace) => {
  const row = await kv.get<{ updatedAt?: string; value?: number }>(counterKey, "json");

  return {
    updatedAt: row?.updatedAt ?? new Date().toISOString(),
    value: row?.value ?? 0,
  };
};

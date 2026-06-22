import { desc, eq, sql } from "drizzle-orm";
import type { AppDb } from "#/db";
import { counterIncrement, counterState } from "#/db/schema";

const globalCounterId = "global";
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
  amount?: -1 | 1;
  authenticated: boolean;
  identity: string;
  userId?: string;
};

export type IncrementCounterResult = CounterSnapshot & {
  amount: number;
};

export const counterStep = (authenticated: boolean) =>
  authenticated ? authenticatedStep : publicStep;

export const readCounter = async (db: AppDb, input: { authenticated: boolean }) => {
  const counter = await readCounterValue(db);

  return {
    authenticated: input.authenticated,
    step: counterStep(input.authenticated),
    updatedAt: counter.updatedAt,
    value: counter.value,
  };
};

export const incrementCounter = async (db: AppDb, input: IncrementCounterInput) => {
  const amount = input.amount ?? counterStep(input.authenticated);
  const now = new Date().toISOString();

  const next = await db.transaction(async (tx) => {
    const [counter] = await tx
      .insert(counterState)
      .values({
        id: globalCounterId,
        updatedAt: now,
        value: amount,
      })
      .onConflictDoUpdate({
        set: {
          updatedAt: now,
          value: sql`${counterState.value} + ${amount}`,
        },
        target: counterState.id,
      })
      .returning();

    const nextCounter = counter ?? { updatedAt: now, value: amount };

    await tx.insert(counterIncrement).values({
      amount,
      authenticated: input.authenticated,
      counterValue: nextCounter.value,
      createdAt: new Date(now),
      id: crypto.randomUUID(),
      identity: input.identity,
      userId: input.userId ?? null,
    });

    return nextCounter;
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

const readCounterValue = async (db: AppDb) => {
  const [row] = await db
    .select({
      updatedAt: counterState.updatedAt,
      value: counterState.value,
    })
    .from(counterState)
    .where(eq(counterState.id, globalCounterId))
    .limit(1);

  return {
    updatedAt: row?.updatedAt ?? new Date().toISOString(),
    value: row?.value ?? 0,
  };
};

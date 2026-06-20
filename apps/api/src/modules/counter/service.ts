import { desc, eq, sql } from "drizzle-orm";
import type { AppDb } from "#/db";
import { counter, counterIncrement } from "#/db/schema";

const counterId = "global";
const recentIncrementLimit = 20;
const publicStep = 1;
const authenticatedStep = 5;

export interface CounterSnapshot {
  readonly authenticated: boolean;
  readonly step: number;
  readonly updatedAt: string;
  readonly value: number;
}

export interface CounterIncrement {
  readonly amount: number;
  readonly authenticated: boolean;
  readonly counterValue: number;
  readonly createdAt: string;
  readonly identity: string;
  readonly userId: string | null;
}

export type IncrementCounterInput = {
  readonly authenticated: boolean;
  readonly identity: string;
  readonly userId?: string;
};

export type IncrementCounterResult = CounterSnapshot & {
  readonly amount: number;
};

export const counterStep = (authenticated: boolean) =>
  authenticated ? authenticatedStep : publicStep;

export const readCounter = async (
  db: AppDb,
  input: { readonly authenticated: boolean },
): Promise<CounterSnapshot> => {
  const [row] = await db
    .select({ updatedAt: counter.updatedAt, value: counter.value })
    .from(counter)
    .where(eq(counter.id, counterId))
    .limit(1);

  return {
    authenticated: input.authenticated,
    step: counterStep(input.authenticated),
    updatedAt: isoTimestamp(row?.updatedAt),
    value: row?.value ?? 0,
  };
};

export const incrementCounter = async (db: AppDb, input: IncrementCounterInput) => {
  const amount = counterStep(input.authenticated);
  const now = new Date().toISOString();
  const updatedAt = new Date(now);

  return db.transaction(async (tx): Promise<IncrementCounterResult> => {
    const [updatedCounter] = await tx
      .insert(counter)
      .values({ id: counterId, updatedAt, value: amount })
      .onConflictDoUpdate({
        set: {
          updatedAt,
          value: sql`${counter.value} + ${amount}`,
        },
        target: counter.id,
      })
      .returning();

    const value = updatedCounter?.value ?? amount;

    await tx.insert(counterIncrement).values({
      amount,
      authenticated: input.authenticated,
      counterValue: value,
      createdAt: updatedAt,
      id: crypto.randomUUID(),
      identity: input.identity,
      userId: input.userId ?? null,
    });

    return {
      amount,
      authenticated: input.authenticated,
      step: amount,
      updatedAt: isoTimestamp(updatedCounter?.updatedAt),
      value,
    };
  });
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

import { desc, eq } from "drizzle-orm";
import type { AppDb } from "#/db";
import { counterIncrement, counterState } from "#/db/schema";

const globalCounterId = "global";
const globalCounterKey = "counter:global";
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

export const ensureCounterStore = async (cache: KVNamespace, db: AppDb) => {
  const storedCounter = await readStoredCounterValue(cache);
  if (storedCounter) {
    await writeCounterProjection(db, storedCounter);
    return storedCounter;
  }

  const initialCounter = (await readLatestCounterFromHistory(db)) ?? {
    updatedAt: new Date().toISOString(),
    value: 0,
  };

  await cache.put(globalCounterKey, JSON.stringify(initialCounter));
  await writeCounterProjection(db, initialCounter);

  return initialCounter;
};

export const readCounter = async (cache: KVNamespace, input: { authenticated: boolean }) => {
  const counter = await readCounterValue(cache);

  return {
    authenticated: input.authenticated,
    step: counterStep(input.authenticated),
    updatedAt: counter.updatedAt,
    value: counter.value,
  };
};

export const incrementCounter = async (
  cache: KVNamespace,
  db: AppDb,
  input: IncrementCounterInput,
) => {
  const amount = counterStep(input.authenticated);
  const now = new Date().toISOString();
  const current = await readCounterValue(cache);
  const next = {
    updatedAt: now,
    value: current.value + amount,
  };

  await cache.put(globalCounterKey, JSON.stringify(next));

  await db.transaction(async (tx) => {
    await tx.insert(counterIncrement).values({
      amount,
      authenticated: input.authenticated,
      counterValue: next.value,
      createdAt: new Date(now),
      id: crypto.randomUUID(),
      identity: input.identity,
      userId: input.userId ?? null,
    });

    await tx
      .insert(counterState)
      .values({
        id: globalCounterId,
        updatedAt: next.updatedAt,
        value: next.value,
      })
      .onConflictDoUpdate({
        set: {
          updatedAt: next.updatedAt,
          value: next.value,
        },
        target: counterState.id,
      });
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

const readCounterValue = async (cache: KVNamespace) => {
  const parsedCounter = await readStoredCounterValue(cache);

  return {
    updatedAt: parsedCounter?.updatedAt ?? new Date().toISOString(),
    value: parsedCounter?.value ?? 0,
  };
};

const readStoredCounterValue = async (cache: KVNamespace) =>
  parseCounterValue(await cache.get(globalCounterKey));

const readLatestCounterFromHistory = async (db: AppDb) => {
  const [row] = await db
    .select({
      updatedAt: counterIncrement.createdAt,
      value: counterIncrement.counterValue,
    })
    .from(counterIncrement)
    .orderBy(desc(counterIncrement.createdAt))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    updatedAt: isoTimestamp(row.updatedAt),
    value: row.value,
  };
};

const writeCounterProjection = async (db: AppDb, counter: { updatedAt: string; value: number }) => {
  const [projection] = await db
    .select({
      updatedAt: counterState.updatedAt,
      value: counterState.value,
    })
    .from(counterState)
    .where(eq(counterState.id, globalCounterId))
    .limit(1);

  if (projection?.updatedAt === counter.updatedAt && projection.value === counter.value) {
    return;
  }

  await upsertCounterProjection(db, counter);
};

const upsertCounterProjection = (db: AppDb, counter: { updatedAt: string; value: number }) =>
  db
    .insert(counterState)
    .values({
      id: globalCounterId,
      updatedAt: counter.updatedAt,
      value: counter.value,
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: counter.updatedAt,
        value: counter.value,
      },
      target: counterState.id,
    });

const parseCounterValue = (rawCounter: string | null) => {
  if (!rawCounter) {
    return null;
  }

  try {
    const value = JSON.parse(rawCounter) as { updatedAt?: unknown; value?: unknown };
    if (typeof value.updatedAt !== "string" || typeof value.value !== "number") {
      return null;
    }

    return {
      updatedAt: value.updatedAt,
      value: value.value,
    };
  } catch {
    return null;
  }
};

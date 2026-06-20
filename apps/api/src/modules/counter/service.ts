import { sql } from "drizzle-orm";
import type { AppDb } from "../../db";
import { counter, counterIncrement } from "../../db/schema";

const counterId = "global";
const counterKey = `counter:${counterId}`;
const recentIncrementLimit = 20;

export interface CounterSnapshot {
  readonly authenticated: boolean;
  readonly multiplier: number;
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

export const readCounter = async (
  kv: KVNamespace,
  input: { readonly authenticated: boolean },
): Promise<CounterSnapshot> => {
  const row = await kv.get<{ readonly updatedAt?: string; readonly value?: number }>(
    counterKey,
    "json",
  );

  return {
    authenticated: input.authenticated,
    multiplier: input.authenticated ? 5 : 1,
    updatedAt: row?.updatedAt ?? new Date().toISOString(),
    value: row?.value ?? 0,
  };
};

export const incrementCounter = async (
  kv: KVNamespace,
  db: AppDb,
  input: {
    readonly authenticated: boolean;
    readonly identity: string;
    readonly userId?: string;
  },
) => {
  const amount = input.authenticated ? 5 : 1;
  const now = new Date().toISOString();
  const current = await kv.get<{ readonly value?: number }>(counterKey, "json");
  const value = (current?.value ?? 0) + amount;

  await kv.put(counterKey, JSON.stringify({ updatedAt: now, value }));
  await db
    .insert(counter)
    .values({ id: counterId, updatedAt: new Date(now), value })
    .onConflictDoUpdate({
      set: { updatedAt: new Date(now), value },
      target: counter.id,
    });
  await db.insert(counterIncrement).values({
    amount,
    authenticated: input.authenticated,
    counterValue: value,
    createdAt: new Date(now),
    id: crypto.randomUUID(),
    identity: input.identity,
    userId: input.userId ?? null,
  });

  return {
    amount,
    authenticated: input.authenticated,
    multiplier: amount,
    updatedAt: now,
    value,
  };
};

export const recentIncrements = async (db: AppDb): Promise<CounterIncrement[]> => {
  const rows = await db.execute<{
    readonly amount: number;
    readonly authenticated: boolean;
    readonly counter_value: number;
    readonly created_at: Date | string;
    readonly identity: string;
    readonly user_id: string | null;
  }>(
    sql`
      select "amount", "authenticated", "counter_value", "created_at", "identity", "user_id"
      from "counter_increment"
      order by "created_at" desc
      limit ${recentIncrementLimit}
    `,
  );

  return (
    rows as readonly {
      readonly amount: number;
      readonly authenticated: boolean;
      readonly counter_value: number;
      readonly created_at: Date | string;
      readonly identity: string;
      readonly user_id: string | null;
    }[]
  ).map((row) => ({
    amount: row.amount,
    authenticated: row.authenticated,
    counterValue: row.counter_value,
    createdAt: isoTimestamp(row.created_at),
    identity: row.identity,
    userId: row.user_id,
  }));
};

const isoTimestamp = (value: Date | string | undefined) =>
  value instanceof Date ? value.toISOString() : (value ?? new Date().toISOString());

import type { Env } from "./.pier/env";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { ensureDatabaseSchema } from "./db/bootstrap";
import { ensureCounterStore } from "./modules/counter/service";

export const createApiContext = async (env: Env) => {
  try {
    const db = createDb(env);
    await ensureDatabaseSchema(db);
    await ensureCounterStore(env.CACHE, db);
    const auth = createAuth(env, db);

    return {
      auth,
      db,
    };
  } catch (error) {
    console.error("pier-demo.api.context_failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export type ApiContext = Awaited<ReturnType<typeof createApiContext>>;

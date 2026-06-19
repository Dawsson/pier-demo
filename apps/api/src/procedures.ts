import { createApi } from "./.pier/api";
import type { Env } from "./.pier/env";
import { createAuth } from "./auth";
import { createDb } from "./db";
import { ensureDatabaseSchema } from "./db/bootstrap";

export const createApiContext = async (env: Env) => {
  try {
    const db = createDb(env);
    await ensureDatabaseSchema(db);
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

export const api = createApi().context<ApiContext>(({ env }) => createApiContext(env));

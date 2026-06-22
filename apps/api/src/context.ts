import type { Env } from "./.pier/env";
import { createAuth } from "./auth";
import { createDb } from "./db";

export const createApiContext = async (env: Env) => {
  try {
    const db = createDb(env);
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

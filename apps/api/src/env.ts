import type InternalWorker from "../../internal/src";

export interface ApiEnv {
  BETTER_AUTH_SECRET: string;
  CACHE: KVNamespace;
  DB: D1Database;
  INTERNAL: Service<typeof InternalWorker>;
  PUBLIC_APP_NAME: string;
  PUBLIC_APP_URL: string;
}

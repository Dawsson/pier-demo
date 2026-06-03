import type InternalWorker from "../../internal/src";

export interface ApiEnv {
  APP_URL: string;
  BETTER_AUTH_SECRET: string;
  CACHE: KVNamespace;
  DB: D1Database;
  DEV_API_URL?: string;
  DEV_WEB_URL?: string;
  INTERNAL: Service<typeof InternalWorker>;
  PUBLIC_APP_NAME: string;
  PUBLIC_APP_URL: string;
}

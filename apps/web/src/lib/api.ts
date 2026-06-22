import { createApiClients } from "@pier/sync/client";
import { contract } from "@pier-demo/api-contract";

import { clientEnv, serverEnv } from "@/.pier/env";

const apiUrl = () =>
  typeof window === "undefined"
    ? (process.env.DEV_API_URL ?? serverEnv.PUBLIC_API_URL)
    : ((import.meta.env.DEV_API_URL as string | undefined) ?? clientEnv.PUBLIC_API_URL);

const syncUrl = () =>
  typeof window === "undefined"
    ? (process.env.PUBLIC_ZERO_CACHE_URL ??
      process.env.VITE_ZERO_CACHE_URL ??
      process.env.ZERO_CACHE_URL ??
      serverEnv.PUBLIC_ZERO_CACHE_URL)
    : clientEnv.PUBLIC_ZERO_CACHE_URL;

export const { endpointClient, rpcClient, syncClient, syncConfig } = createApiClients(contract, {
  apiUrl: apiUrl(),
  storageKey: "pier-demo-sync-v1",
  syncUrl: syncUrl(),
});

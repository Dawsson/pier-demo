import { createApiClients } from "@pier/sync/client";
import { contract } from "@pier-demo/api-contract";

import { clientEnv, serverEnv } from "@/.pier/env";
import { withSyncOptions } from "@/lib/sync-client-options";

const apiUrl = () =>
  typeof window === "undefined"
    ? serverEnv.PUBLIC_API_URL
    : ((import.meta.env.DEV_API_URL as string | undefined) ?? clientEnv.PUBLIC_API_URL);

const syncUrl = () =>
  typeof window === "undefined"
    ? serverEnv.PUBLIC_ZERO_CACHE_URL
    : ((import.meta.env.DEV_ZERO_URL as string | undefined) ?? clientEnv.PUBLIC_ZERO_CACHE_URL);

const clients = createApiClients(contract, {
  apiUrl: apiUrl(),
  storageKey: "pier-demo-sync-v1",
  syncUrl: syncUrl(),
});

export const { endpointClient, rpcClient } = clients;
export const syncClient = withSyncOptions(clients.syncClient, clients.syncClient);
export const syncMutators = clients.syncClient.mutators;

export const syncConfig =
  typeof window !== "undefined" && import.meta.env.DEV
    ? ({
        ...clients.syncConfig,
        mutateURL: undefined,
        queryURL: undefined,
      } as unknown as typeof clients.syncConfig)
    : clients.syncConfig;

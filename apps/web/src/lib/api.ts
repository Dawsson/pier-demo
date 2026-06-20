import { createApiClients } from "@pier/sync/client";
import { contract } from "@pier-demo/api/contract";

import { clientEnv, serverEnv } from "@/.pier/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const { endpointClient, rpcClient, syncClient, syncConfig } = createApiClients(contract, {
  apiUrl: apiUrl(),
  storageKey: "pier-demo-sync-v1",
  syncUrl: apiUrl(),
});

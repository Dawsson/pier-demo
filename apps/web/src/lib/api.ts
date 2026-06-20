import { createApiClients } from "@pier/sync/client";
import { contract } from "@pier-demo/api/contract";

import { clientEnv, serverEnv } from "../.pier/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

const rpcUrl = () => apiUrl().path("operations");

export const { endpointClient, rpcClient, syncClient, syncConfig } = createApiClients(contract, {
  apiUrl: apiUrl(),
  rpcBaseUrl: rpcUrl(),
  storageKey: "pier-demo-sync-v1",
  syncUrl: apiUrl(),
});

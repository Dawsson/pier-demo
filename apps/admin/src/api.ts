import { createApiClients } from "@pier/sync/client";
import type { UseQueryOptions } from "@tanstack/react-query";

import { contract } from "../../api/src/contract";
import { clientEnv, serverEnv } from "./.pier/env";

type AdminSummary = Awaited<ReturnType<typeof rpcClient.admin.summary.call>>;
type AdminSummaryQueryOptions<TData = AdminSummary> = Omit<
  UseQueryOptions<AdminSummary, Error, TData>,
  "queryFn" | "queryKey"
>;

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const { endpointClient, rpcClient, syncClient, syncConfig } = createApiClients(contract, {
  apiUrl: apiUrl(),
  storageKey: "pier-demo-admin-sync-v1",
  syncUrl: apiUrl(),
});

export const adminSummaryQueryOptions = <TData = AdminSummary>(
  options: AdminSummaryQueryOptions<TData> = {},
) => ({
  ...options,
  queryFn: () => rpcClient.admin.summary.call(),
  queryKey: rpcClient.admin.summary.queryKey(),
});

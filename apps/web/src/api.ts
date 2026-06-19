import { callSyncQuery, createApiClients } from "@pier/sync/client";
import type { UseQueryOptions } from "@tanstack/react-query";

import { contract } from "../../api/src/contract";
import { clientEnv, serverEnv } from "./.pier/env";

type CounterSnapshot = Awaited<ReturnType<typeof rpcClient.counter.get.call>>;
type CounterQueryOptions<TData = CounterSnapshot> = Omit<
  UseQueryOptions<CounterSnapshot, Error, TData>,
  "queryFn" | "queryKey"
>;
type AccountMe = {
  readonly email: string;
  readonly emailVerified: boolean;
  readonly id: string;
  readonly image?: string | null;
  readonly name: string;
  readonly role?: string | null;
} | null;

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const { endpointClient, rpcClient, syncClient, syncConfig } = createApiClients(contract, {
  apiUrl: apiUrl(),
  storageKey: "pier-demo-sync-v1",
  syncUrl: apiUrl(),
});

export const counterQueryOptions = <TData = CounterSnapshot>(
  options: CounterQueryOptions<TData> = {},
) => ({
  ...options,
  queryFn: () => rpcClient.counter.get.call(),
  queryKey: rpcClient.counter.get.queryKey(),
});

export const accountMeQueryOptions = () => ({
  queryFn: () => callSyncQuery<AccountMe>(syncConfig.queryURL, "account.me"),
  queryKey: syncClient.account.me.queryKey(),
  staleTime: 15_000,
});

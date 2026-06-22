import { createApiClients } from "@pier/sync/client";
import type { QueryState } from "@pier/sync/react";
import { contract } from "@pier-demo/api-contract";

import { clientEnv, serverEnv } from "@/.pier/env";

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

type QueryData<TState> = TState extends QueryState<infer TData> ? TData : never;
type InitialDataOptions<TOptions, TInitial> = Omit<NonNullable<TOptions>, "input"> & {
  readonly initialData: TInitial;
  readonly input?: NonNullable<TOptions> extends { readonly input: infer TInput } ? TInput : never;
};

type UseQueryWithInitialData<TUseQuery> = TUseQuery extends (
  options?: infer TOptions,
) => infer TState
  ? {
      (options?: TOptions): TState;
      <TInitial extends NonNullable<QueryData<TState>>>(
        options: InitialDataOptions<TOptions, TInitial>,
      ): QueryState<Exclude<QueryData<TState>, undefined>>;
    }
  : TUseQuery;

type WithInitialData<TValue> = TValue extends (...args: never[]) => unknown
  ? TValue
  : TValue extends { readonly useQuery: infer TUseQuery }
    ? Omit<TValue, "useQuery"> & { readonly useQuery: UseQueryWithInitialData<TUseQuery> }
    : TValue extends object
      ? { readonly [TKey in keyof TValue]: WithInitialData<TValue[TKey]> }
      : TValue;

const queryClientProxyCache = new WeakMap<object, unknown>();

function withInitialData<TValue extends object>(value: TValue): WithInitialData<TValue> {
  const cached = queryClientProxyCache.get(value);
  if (cached) {
    return cached as WithInitialData<TValue>;
  }

  const proxy = new Proxy(value, {
    get(target, property, receiver) {
      const propertyValue = Reflect.get(target, property, receiver);

      if (property === "useQuery" && typeof propertyValue === "function") {
        return (options?: { readonly initialData?: unknown }) => {
          const { initialData, ...queryOptions } = options ?? {};
          const useQuery = propertyValue as (options?: object) => QueryState<unknown>;
          const query = useQuery(Object.keys(queryOptions).length > 0 ? queryOptions : undefined);

          if (initialData === undefined || query.data !== undefined) {
            return query;
          }

          return {
            ...query,
            data: initialData,
            isLoading: false,
            isSuccess: true,
          };
        };
      }

      if (typeof propertyValue === "object" && propertyValue !== null) {
        return withInitialData(propertyValue);
      }

      return propertyValue;
    },
  });

  queryClientProxyCache.set(value, proxy);
  return proxy as WithInitialData<TValue>;
}

export const { endpointClient, rpcClient } = clients;
export const syncClient = withInitialData(clients.syncClient);
export const syncMutators = clients.syncClient.mutators;

export const syncConfig =
  typeof window !== "undefined" && import.meta.env.DEV
    ? ({
        ...clients.syncConfig,
        mutateURL: undefined,
        queryURL: undefined,
      } as unknown as typeof clients.syncConfig)
    : clients.syncConfig;

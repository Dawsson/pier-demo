import { formatSyncError, syncErrorFromMutator } from "@pier/sync/errors";
import type { QueryState } from "@pier/sync/react";
import { useZero } from "@rocicorp/zero/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

type QueryData<TState> = TState extends QueryState<infer TData> ? TData : never;
type InitialDataOptions<TOptions, TInitial> = Omit<NonNullable<TOptions>, "input"> & {
  readonly initialData: TInitial;
  readonly input?: NonNullable<TOptions> extends { readonly input: infer TInput } ? TInput : never;
};

type UseQueryWithInitialData<TUseQuery> = TUseQuery extends (
  options?: infer TOptions,
) => infer TState
  ? {
      (options?: TOptions & { readonly onError?: (error: unknown) => void }): TState;
      <TInitial extends NonNullable<QueryData<TState>>>(
        options: InitialDataOptions<TOptions, TInitial> & {
          readonly onError?: (error: unknown) => void;
        },
      ): QueryState<Exclude<QueryData<TState>, undefined>>;
    }
  : TUseQuery;

type MutationArgs<TState> = TState extends { readonly mutate: (args: infer TArgs) => void }
  ? TArgs
  : never;

type EnhancedMutationOptions<TOptions, TArgs> = Omit<
  NonNullable<TOptions>,
  "onError" | "onSettled"
> & {
  readonly onError?: (error: Error, args: TArgs) => void;
  readonly onServerError?: (error: Error, args: TArgs) => void;
  readonly onServerSettled?: (args: TArgs, error: Error | null) => void;
  readonly onServerSuccess?: (args: TArgs) => void;
  readonly onSettled?: (args: TArgs, error: Error | null) => void;
};

type EnhancedMutationState<TState> = TState & {
  readonly isServerError: boolean;
  readonly serverError: unknown;
  readonly serverErrorMessage: string | null;
};

type UseMutationWithServerError<TUseMutation> = TUseMutation extends (
  options?: infer TOptions,
) => infer TState
  ? (
      options?: EnhancedMutationOptions<TOptions, MutationArgs<TState>>,
    ) => EnhancedMutationState<TState>
  : TUseMutation;

type WithSyncOptions<TValue> = TValue extends (...args: never[]) => unknown
  ? TValue
  : TValue extends { readonly useMutation: infer TUseMutation }
    ? Omit<TValue, "useMutation"> & {
        readonly useMutation: UseMutationWithServerError<TUseMutation>;
      }
    : TValue extends { readonly useQuery: infer TUseQuery }
      ? Omit<TValue, "useQuery"> & { readonly useQuery: UseQueryWithInitialData<TUseQuery> }
      : TValue extends object
        ? { readonly [TKey in keyof TValue]: WithSyncOptions<TValue[TKey]> }
        : TValue;

type EnhancedMutationResult<TArgs> = {
  readonly error: unknown;
  readonly errorMessage: string | null;
  readonly isError: boolean;
  readonly isPending: boolean;
  readonly isServerError: boolean;
  readonly isSuccess: boolean;
  readonly mutate: (args: TArgs) => void;
  readonly mutateAsync: (args: TArgs) => Promise<void>;
  readonly serverError: unknown;
  readonly serverErrorMessage: string | null;
};

type EnhancedMutationRuntimeOptions<TArgs> = {
  readonly onError?: (error: Error, args: TArgs) => void;
  readonly onSettled?: (args: TArgs, error: Error | null) => void;
  readonly onServerError?: (error: Error, args: TArgs) => void;
  readonly onServerSettled?: (args: TArgs, error: Error | null) => void;
  readonly onServerSuccess?: (args: TArgs) => void;
  readonly onSuccess?: (args: TArgs) => void;
};

type SyncMutator<TArgs> = (args: TArgs) => unknown;

type SyncClientRoot = {
  readonly mutators: unknown;
};

const syncClientProxyCache = new WeakMap<object, unknown>();

const mutatorAppErrorSchema = z
  .object({
    details: z.unknown().optional(),
    message: z.string(),
    type: z.literal("app"),
  })
  .passthrough();

export function withSyncOptions<TValue extends object>(
  value: TValue,
  root: SyncClientRoot,
  path: readonly string[] = [],
): WithSyncOptions<TValue> {
  const cached = syncClientProxyCache.get(value);
  if (cached) {
    return cached as WithSyncOptions<TValue>;
  }

  const proxy = new Proxy(value, {
    get(target, property, receiver) {
      const propertyValue = Reflect.get(target, property, receiver);

      if (property === "mutators") {
        return propertyValue;
      }

      if (property === "useQuery" && typeof propertyValue === "function") {
        return (options?: {
          readonly initialData?: unknown;
          readonly onError?: (error: unknown) => void;
        }) => useSyncQuery(propertyValue as (options?: object) => QueryState<unknown>, options);
      }

      if (property === "useMutation") {
        const mutator = readPath(root.mutators, path);

        if (typeof mutator !== "function") {
          throw new TypeError(`Zero mutator ${path.join(".")} is not registered.`);
        }

        return (options?: EnhancedMutationRuntimeOptions<unknown>) =>
          useSyncMutation(mutator as SyncMutator<unknown>, options);
      }

      if (
        typeof property === "string" &&
        typeof propertyValue === "object" &&
        propertyValue !== null
      ) {
        return withSyncOptions(propertyValue, root, [...path, property]);
      }

      return propertyValue;
    },
  });

  syncClientProxyCache.set(value, proxy);
  return proxy as WithSyncOptions<TValue>;
}

function useSyncQuery<TData>(
  useQuery: (options?: object) => QueryState<TData | undefined>,
  options?: { readonly initialData?: TData; readonly onError?: (error: unknown) => void },
) {
  const lastError = useRef<unknown>(null);
  const { initialData, onError, ...queryOptions } = options ?? {};
  const query = useQuery(Object.keys(queryOptions).length > 0 ? queryOptions : undefined);
  const data = query.data ?? initialData;
  const error = query.isError ? query.error : null;

  useEffect(() => {
    if (error && error !== lastError.current) {
      lastError.current = error;
      onError?.(error);
    } else if (!error) {
      lastError.current = null;
    }
  }, [error, onError]);

  if (data === undefined) {
    return query;
  }

  return {
    ...query,
    data,
    isLoading: false,
    isSuccess: true,
  };
}

function useSyncMutation<TArgs>(
  createRequest: SyncMutator<TArgs>,
  options: EnhancedMutationRuntimeOptions<TArgs> = {},
): EnhancedMutationResult<TArgs> {
  const zero = useZero();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setPending] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<Error | null>(null);

  const mutateAsync = useCallback(
    async (args: TArgs) => {
      setError(null);
      setPending(true);
      setServerError(null);
      setSuccess(false);
      let settledError: Error | null = null;

      try {
        const result = zero.mutate(createRequest(args) as Parameters<typeof zero.mutate>[0]);
        const clientResult = await result.client;

        if (clientResult.type === "error") {
          throw normalizeMutationError(clientResult.error);
        }

        void result.server.then((serverResult) => {
          let settledServerError: Error | null = null;

          if (serverResult.type === "error") {
            settledServerError = normalizeMutationError(serverResult.error);
            setServerError(settledServerError);
            options.onServerError?.(settledServerError, args);
          } else {
            options.onServerSuccess?.(args);
          }

          options.onServerSettled?.(args, settledServerError);
        });

        setSuccess(true);
        options.onSuccess?.(args);
      } catch (nextError) {
        settledError = normalizeMutationError(nextError);
        setError(settledError);
        options.onError?.(settledError, args);
      } finally {
        setPending(false);
        options.onSettled?.(args, settledError);
      }
    },
    [createRequest, options, zero],
  );

  const mutate = useCallback((args: TArgs) => void mutateAsync(args), [mutateAsync]);

  return {
    error,
    errorMessage: error ? formatSyncError(error) : null,
    isError: error !== null,
    isPending,
    isServerError: serverError !== null,
    isSuccess,
    mutate,
    mutateAsync,
    serverError,
    serverErrorMessage: serverError ? formatSyncError(serverError) : null,
  };
}

function normalizeMutationError(error: unknown): Error {
  const appError = mutatorAppErrorSchema.safeParse(error);
  if (appError.success) {
    return syncErrorFromMutator(appError.data);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(formatSyncError(error));
}

function readPath(root: unknown, path: readonly string[]) {
  let value = root;

  for (const key of path) {
    if (typeof value !== "object" || value === null || !(key in value)) {
      return;
    }

    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

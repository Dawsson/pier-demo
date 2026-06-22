import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { syncClient, syncConfig } from "@/lib/api";
import { getPublicCounterServerFn, type PublicCounterInitialData } from "@/lib/counter-data";
import { prepareSyncSession, type PreparedSyncSession } from "@/lib/sync-session";
import { HomeShell, type HomeShellTiming } from "./-components/home-shell";

const counterRateLimit = 20;
const counterRateLimitWindowMs = 60_000;
const showStartupTiming = import.meta.env.DEV;

const now = () => (typeof performance === "undefined" ? 0 : performance.now());

type StartupTiming = HomeShellTiming;

export const Route = createFileRoute("/")({
  loader: () => getPublicCounterServerFn(),
  component: HomeRoute,
  staleTime: 5_000,
});

function HomeRoute() {
  const initialData = Route.useLoaderData();

  if (initialData.hasSessionCookie) {
    return <SessionBackedHome initialData={initialData} />;
  }

  return <LazyGuestHome initialData={initialData} />;
}

function SessionBackedHome({ initialData }: { readonly initialData: PublicCounterInitialData }) {
  const prepareStarted = useRef(false);
  const [preparedSession, setPreparedSession] = useState<PreparedSyncSession | null>(null);
  const [preparePending, setPreparePending] = useState(true);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [timing, setTiming] = useState<StartupTiming>(() => ({
    startedAt: now(),
  }));

  const updateTiming = useCallback((nextTiming: Partial<StartupTiming>) => {
    if (!showStartupTiming) {
      return;
    }

    setTiming((currentTiming) => ({
      ...currentTiming,
      ...nextTiming,
    }));
  }, []);

  useEffect(() => {
    if (prepareStarted.current) {
      return;
    }

    prepareStarted.current = true;
    void (async () => {
      try {
        const prepared = await prepareSyncSession({ createAnonymous: false });
        updateTiming({ sessionReadyAt: now() });
        setPreparedSession(prepared);
      } catch (error) {
        showAnonymousAuthErrorToast(error);
      } finally {
        setPreparePending(false);
      }
    })();
  }, [updateTiming]);

  if (preparePending) {
    return (
      <HomeShell
        counterValue={initialData.counter.value}
        isAdjusting
        timing={timing}
        ssrMs={initialData.ssrMs}
      />
    );
  }

  if (!preparedSession) {
    return (
      <LazyGuestHome
        initialData={initialData}
        timingOverride={timing}
        updateTimingOverride={updateTiming}
      />
    );
  }

  return (
    <SyncedHome
      initialData={initialData}
      onCounterReady={(counterReadyAt) => updateTiming({ counterReadyAt })}
      onPendingAdjustmentSubmitted={() => setPendingAdjustment(null)}
      pendingAdjustment={pendingAdjustment}
      preparedSession={preparedSession}
      timing={timing}
    />
  );
}

function LazyGuestHome({
  initialData,
  timingOverride,
  updateTimingOverride,
}: {
  readonly initialData: PublicCounterInitialData;
  readonly timingOverride?: StartupTiming;
  readonly updateTimingOverride?: (nextTiming: Partial<StartupTiming>) => void;
}) {
  const anonymousSignInStarted = useRef(false);
  const preparedSessionRef = useRef<PreparedSyncSession | null>(null);
  const preparePromiseRef = useRef<Promise<PreparedSyncSession | null> | null>(null);
  const [preparedSession, setPreparedSession] = useState<PreparedSyncSession | null>(null);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [guestAuthPending, setGuestAuthPending] = useState(false);
  const [localTiming, setLocalTiming] = useState<StartupTiming>(() => ({
    startedAt: now(),
  }));
  const timing = timingOverride ?? localTiming;

  const updateTiming = useCallback(
    (nextTiming: Partial<StartupTiming>) => {
      if (!showStartupTiming) {
        return;
      }

      if (updateTimingOverride) {
        updateTimingOverride(nextTiming);
        return;
      }

      setLocalTiming((currentTiming) => ({
        ...currentTiming,
        ...nextTiming,
      }));
    },
    [updateTimingOverride],
  );

  const prepareGuestSession = useCallback(
    (input: { readonly interactive: boolean }) => {
      if (preparedSessionRef.current) {
        return Promise.resolve(preparedSessionRef.current);
      }

      if (preparePromiseRef.current) {
        if (input.interactive) {
          setGuestAuthPending(true);
        }

        return preparePromiseRef.current;
      }

      anonymousSignInStarted.current = true;
      if (input.interactive) {
        setGuestAuthPending(true);
      }
      updateTiming({ anonymousAuthStartAt: now() });

      const promise = prepareSyncSession({ createAnonymous: true })
        .then((prepared) => {
          if (!prepared) {
            throw new Error("Anonymous session was not created.");
          }

          preparedSessionRef.current = prepared;
          updateTiming({ sessionReadyAt: now() });
          setPreparedSession(prepared);

          return prepared;
        })
        .catch((error) => {
          if (input.interactive) {
            setPendingAdjustment(null);
            updateTiming({ anonymousAuthFailedAt: now() });
            showAnonymousAuthErrorToast(error);
          }

          return null;
        })
        .finally(() => {
          updateTiming({ anonymousAuthEndAt: now() });
          anonymousSignInStarted.current = false;
          preparePromiseRef.current = null;
          if (input.interactive) {
            setGuestAuthPending(false);
          }
        });

      preparePromiseRef.current = promise;
      return promise;
    },
    [updateTiming],
  );

  const requestAdjustment = (amount: -1 | 1) => {
    setPendingAdjustment({ amount, id: crypto.randomUUID() });

    if (preparedSession) {
      return;
    }

    void prepareGuestSession({ interactive: true });
  };

  if (!preparedSession) {
    return (
      <HomeShell
        counterValue={initialData.counter.value}
        isAdjusting={guestAuthPending}
        onAdjust={requestAdjustment}
        onPrewarm={() => prepareGuestSession({ interactive: false })}
        timing={timing}
        ssrMs={initialData.ssrMs}
      />
    );
  }

  return (
    <SyncedHome
      initialData={initialData}
      onCounterReady={(counterReadyAt) => updateTiming({ counterReadyAt })}
      onPendingAdjustmentSubmitted={() => setPendingAdjustment(null)}
      pendingAdjustment={pendingAdjustment}
      preparedSession={preparedSession}
      timing={timing}
    />
  );
}

function SyncedHome({
  initialData,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
  preparedSession,
  timing,
}: {
  readonly initialData: PublicCounterInitialData;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
  readonly preparedSession: PreparedSyncSession;
  readonly timing: StartupTiming;
}) {
  const userId = contract.clientContext.getUserID(preparedSession.user as never);
  const context = useMemo(
    () => contract.clientContext.create(preparedSession.user as never),
    [preparedSession],
  );

  return (
    <SyncProvider
      auth={preparedSession.auth.token}
      cacheURL={syncConfig.cacheURL}
      context={context as never}
      mutateURL={syncConfig.mutateURL}
      mutators={syncClient.mutators}
      queryURL={syncConfig.queryURL}
      schema={schema}
      storageKey={syncConfig.storageKey}
      userID={userId}
    >
      <HomeCounter
        initialCounterValue={initialData.counter.value}
        onCounterReady={onCounterReady}
        onPendingAdjustmentSubmitted={onPendingAdjustmentSubmitted}
        pendingAdjustment={pendingAdjustment}
        timing={timing}
        ssrMs={initialData.ssrMs}
      />
    </SyncProvider>
  );
}

type PendingAdjustment = {
  readonly amount: -1 | 1;
  readonly id: string;
};

function HomeCounter({
  initialCounterValue,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
  ssrMs,
  timing,
}: {
  readonly initialCounterValue: number;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
  readonly ssrMs: number;
  readonly timing: StartupTiming;
}) {
  const counter = syncClient.counter.current.useQuery();
  const queryErrorToastShown = useRef(false);
  const counterReadyReported = useRef(false);
  const syncMountedAt = useRef(now());
  const submittedPendingAdjustmentId = useRef<string | null>(null);
  const submittedAtRef = useRef<number[]>([]);
  const increment = syncClient.counter.increment.useMutation({
    onError: (error) => {
      showCounterErrorToast(error);
    },
  });

  const counterValue = counter.data?.value ?? initialCounterValue;
  const adjust = useCallback(
    (amount: -1 | 1) => {
      const now = Date.now();
      const windowStart = now - counterRateLimitWindowMs;
      submittedAtRef.current = submittedAtRef.current.filter(
        (submittedAt) => submittedAt > windowStart,
      );

      if (submittedAtRef.current.length >= counterRateLimit) {
        showCounterRateLimitToast();
        return;
      }

      submittedAtRef.current.push(now);
      increment.mutate({ amount });
    },
    [increment],
  );

  useEffect(() => {
    if (
      !pendingAdjustment ||
      submittedPendingAdjustmentId.current === pendingAdjustment.id ||
      increment.isPending
    ) {
      return;
    }

    submittedPendingAdjustmentId.current = pendingAdjustment.id;
    adjust(pendingAdjustment.amount);
    onPendingAdjustmentSubmitted();
  }, [adjust, increment.isPending, pendingAdjustment, onPendingAdjustmentSubmitted]);

  useEffect(() => {
    if (!showStartupTiming || counterReadyReported.current || counter.data === undefined) {
      return;
    }

    counterReadyReported.current = true;
    onCounterReady(now());
  }, [counter.data, onCounterReady]);

  useEffect(() => {
    if (!counter.isError || queryErrorToastShown.current) {
      return;
    }

    queryErrorToastShown.current = true;
    showCounterErrorToast(counter.error);
  }, [counter.error, counter.isError]);

  return (
    <HomeShell
      counterValue={counterValue}
      isAdjusting={false}
      onAdjust={adjust}
      ssrMs={ssrMs}
      timing={{ ...timing, syncMountedAt: syncMountedAt.current }}
    />
  );
}

function showCounterErrorToast(error: unknown) {
  const message = errorMessage(error);
  const isRateLimited = /rate.?limit|too many|429/i.test(message);

  if (isRateLimited) {
    showCounterRateLimitToast();
    return;
  }

  toast.error("Counter unavailable", {
    description: "The synced counter could not update.",
    id: "counter-sync-error",
  });
}

function showCounterRateLimitToast() {
  toast.warning("Slow down", {
    description: "Give it a moment before counting again.",
    id: "counter-rate-limited",
  });
}

function showAnonymousAuthErrorToast(error: unknown) {
  const message = errorMessage(error);
  const isRateLimited = /rate.?limit|too many|429/i.test(message);

  toast.warning(isRateLimited ? "Anonymous auth rate limited" : "Anonymous auth failed", {
    description: isRateLimited
      ? "Wait a moment before creating another local guest session."
      : "Reload the page to try creating a guest session again.",
    id: "anonymous-auth-error",
  });
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { readonly message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return String(error);
}

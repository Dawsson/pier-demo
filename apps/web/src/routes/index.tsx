import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { endpointClient, syncClient, syncConfig } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { getPublicCounterServerFn, type PublicCounterInitialData } from "@/lib/counter-data";

const counterRateLimit = 20;
const counterRateLimitWindowMs = 60_000;
const showStartupTiming = import.meta.env.DEV;

const now = () => (typeof performance === "undefined" ? 0 : performance.now());

type StartupTiming = {
  readonly anonymousAuthEndAt?: number;
  readonly anonymousAuthFailedAt?: number;
  readonly anonymousAuthStartAt?: number;
  readonly counterReadyAt?: number;
  readonly sessionReadyAt?: number;
  readonly startedAt: number;
  readonly syncMountedAt?: number;
};

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
  const session = authClient.useSession();
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [timing, setTiming] = useState<StartupTiming>(() => ({
    startedAt: now(),
  }));

  const updateTiming = (nextTiming: Partial<StartupTiming>) => {
    if (!showStartupTiming) {
      return;
    }

    setTiming((currentTiming) => ({
      ...currentTiming,
      ...nextTiming,
    }));
  };

  useEffect(() => {
    if (session.isPending || timing.sessionReadyAt !== undefined) {
      return;
    }

    updateTiming({ sessionReadyAt: now() });
  }, [session.isPending, timing.sessionReadyAt]);

  if (session.isPending) {
    return (
      <HomeShell
        counterValue={initialData.counter.value}
        isAdjusting
        timing={timing}
        ssrMs={initialData.ssrMs}
      />
    );
  }

  if (!session.data?.user) {
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
      timing={timing}
      user={session.data.user}
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
  const [user, setUser] = useState<unknown>(null);
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const [guestAuthPending, setGuestAuthPending] = useState(false);
  const [localTiming, setLocalTiming] = useState<StartupTiming>(() => ({
    startedAt: now(),
  }));
  const timing = timingOverride ?? localTiming;

  const updateTiming = (nextTiming: Partial<StartupTiming>) => {
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
  };

  const requestAdjustment = (amount: -1 | 1) => {
    setPendingAdjustment({ amount, id: crypto.randomUUID() });

    if (user || anonymousSignInStarted.current) {
      return;
    }

    anonymousSignInStarted.current = true;
    setGuestAuthPending(true);
    updateTiming({ anonymousAuthStartAt: now() });

    void (async () => {
      try {
        const existingSession = await authClient.getSession();
        if (existingSession.data?.user) {
          updateTiming({ sessionReadyAt: now() });
          setUser(existingSession.data.user);
          return;
        }

        const anonymousSession = await authClient.signIn.anonymous();
        if (anonymousSession.error) {
          setPendingAdjustment(null);
          updateTiming({ anonymousAuthFailedAt: now() });
          showAnonymousAuthErrorToast(anonymousSession.error);
          return;
        }

        const nextUser = anonymousSession.data?.user ?? (await authClient.getSession()).data?.user;
        if (!nextUser) {
          setPendingAdjustment(null);
          updateTiming({ anonymousAuthFailedAt: now() });
          showAnonymousAuthErrorToast(new Error("Anonymous session was not created."));
          return;
        }

        updateTiming({ sessionReadyAt: now() });
        setUser(nextUser);
      } catch (error) {
        setPendingAdjustment(null);
        updateTiming({ anonymousAuthFailedAt: now() });
        showAnonymousAuthErrorToast(error);
      } finally {
        updateTiming({ anonymousAuthEndAt: now() });
        anonymousSignInStarted.current = false;
        setGuestAuthPending(false);
      }
    })();
  };

  if (!user) {
    return (
      <HomeShell
        counterValue={initialData.counter.value}
        isAdjusting={guestAuthPending}
        onAdjust={requestAdjustment}
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
      timing={timing}
      user={user}
    />
  );
}

function SyncedHome({
  initialData,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
  timing,
  user,
}: {
  readonly initialData: PublicCounterInitialData;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
  readonly timing: StartupTiming;
  readonly user: unknown;
}) {
  return (
    <SyncProvider
      authEndpoint={endpointClient.sync.auth}
      client={syncClient}
      clientContext={contract.clientContext as never}
      config={syncConfig}
      schema={schema}
      user={user as never}
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
  const isAdjusting = increment.isPending;
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
      isAdjusting={isAdjusting}
      onAdjust={adjust}
      ssrMs={ssrMs}
      timing={{ ...timing, syncMountedAt: syncMountedAt.current }}
    />
  );
}

function HomeShell({
  counterValue = 0,
  isAdjusting = true,
  onAdjust,
  ssrMs,
  timing,
}: {
  readonly counterValue?: number;
  readonly isAdjusting?: boolean;
  readonly onAdjust?: (amount: -1 | 1) => void;
  readonly ssrMs?: number;
  readonly timing?: StartupTiming;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background px-5 py-7 text-foreground sm:px-7">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <ThemeSwitcher />
          <Button asChild size="sm" variant="ghost">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
        </nav>
      </header>

      <section
        aria-labelledby="counter-title"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center"
      >
        <h1 id="counter-title" className="sr-only">
          Public counter
        </h1>

        <div className="grid w-full grid-cols-[3.25rem_minmax(8rem,1fr)_3.25rem] items-center gap-5 sm:grid-cols-[4rem_minmax(12rem,1fr)_4rem] sm:gap-8">
          <Button
            aria-label="Decrease counter"
            className="size-13 rounded-full border border-border bg-transparent p-0 text-3xl text-muted-foreground shadow-none hover:border-foreground hover:bg-foreground hover:text-background sm:size-16 sm:text-4xl"
            disabled={isAdjusting || !onAdjust}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => onAdjust?.(-1)}
          >
            <span aria-hidden className="-translate-y-0.5">
              −
            </span>
          </Button>

          <span
            key={counterValue}
            aria-live="polite"
            className="min-w-0 animate-in fade-in slide-in-from-bottom-1 font-semibold text-8xl leading-none tabular-nums duration-150 sm:text-[8rem] md:text-[9rem]"
          >
            {counterValue}
          </span>

          <Button
            aria-label="Increase counter"
            className="size-13 rounded-full border border-border bg-transparent p-0 text-3xl text-muted-foreground shadow-none hover:border-foreground hover:bg-foreground hover:text-background sm:size-16 sm:text-4xl"
            disabled={isAdjusting || !onAdjust}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => onAdjust?.(1)}
          >
            <span aria-hidden className="-translate-y-0.5">
              +
            </span>
          </Button>
        </div>
        {showStartupTiming && timing ? (
          <StartupTimingReadout ssrMs={ssrMs} timing={timing} />
        ) : null}
      </section>
    </main>
  );
}

function StartupTimingReadout({
  ssrMs,
  timing,
}: {
  readonly ssrMs: number | undefined;
  readonly timing: StartupTiming;
}) {
  const totalReadyMs =
    timing.counterReadyAt === undefined ? undefined : timing.counterReadyAt - timing.startedAt;
  const authFailed = timing.anonymousAuthFailedAt !== undefined;
  const authMs =
    timing.sessionReadyAt === undefined ? undefined : timing.sessionReadyAt - timing.startedAt;
  const anonymousAuthMs =
    timing.anonymousAuthStartAt === undefined || timing.anonymousAuthEndAt === undefined
      ? undefined
      : timing.anonymousAuthEndAt - timing.anonymousAuthStartAt;
  const syncMs =
    timing.syncMountedAt === undefined || timing.counterReadyAt === undefined
      ? undefined
      : timing.counterReadyAt - timing.syncMountedAt;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {authFailed
          ? "Anonymous auth blocked"
          : totalReadyMs === undefined
            ? "SSR value ready"
            : `Live sync ready in ${formatMs(totalReadyMs)}`}
      </span>
      <span aria-hidden>·</span>
      <span>ssr {formatTimingValue(ssrMs)}</span>
      <span aria-hidden>·</span>
      <span>session {formatTimingValue(authMs)}</span>
      <span aria-hidden>·</span>
      <span>
        guest auth{" "}
        {authFailed
          ? "failed"
          : anonymousAuthMs === undefined
            ? "deferred"
            : formatTimingValue(anonymousAuthMs)}
      </span>
      <span aria-hidden>·</span>
      <span>live counter {formatTimingValue(syncMs)}</span>
    </div>
  );
}

function formatTimingValue(value: number | undefined) {
  return value === undefined ? "..." : formatMs(value);
}

function formatMs(value: number) {
  return `${Math.max(0, Math.round(value))}ms`;
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

import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { endpointClient, syncClient, syncConfig } from "@/lib/api";
import { authClient } from "@/lib/auth";

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
  component: HomeRoute,
});

function HomeRoute() {
  const session = authClient.useSession();
  const anonymousSignInStarted = useRef(false);
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

  useEffect(() => {
    if (session.isPending || session.data?.user || anonymousSignInStarted.current) {
      return;
    }

    anonymousSignInStarted.current = true;
    updateTiming({ anonymousAuthStartAt: now() });
    void (async () => {
      try {
        const result = await authClient.signIn.anonymous();
        if (result.error) {
          updateTiming({ anonymousAuthFailedAt: now() });
          showAnonymousAuthErrorToast(result.error);
        }
      } catch (error) {
        updateTiming({ anonymousAuthFailedAt: now() });
        showAnonymousAuthErrorToast(error);
      } finally {
        updateTiming({ anonymousAuthEndAt: now() });
        anonymousSignInStarted.current = false;
      }
    })();
  }, [session.data?.user, session.isPending]);

  if (!session.data?.user) {
    return <HomeShell timing={timing} />;
  }

  return (
    <SyncProvider
      authEndpoint={endpointClient.sync.auth}
      client={syncClient}
      clientContext={contract.clientContext as never}
      config={syncConfig}
      schema={schema}
      user={session.data.user as never}
    >
      <HomeCounter
        onCounterReady={(counterReadyAt) => updateTiming({ counterReadyAt })}
        timing={timing}
      />
    </SyncProvider>
  );
}

function HomeCounter({
  onCounterReady,
  timing,
}: {
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly timing: StartupTiming;
}) {
  const counter = syncClient.counter.current.useQuery();
  const queryErrorToastShown = useRef(false);
  const counterReadyReported = useRef(false);
  const syncMountedAt = useRef(now());
  const submittedAtRef = useRef<number[]>([]);
  const increment = syncClient.counter.increment.useMutation({
    onError: (error) => {
      showCounterErrorToast(error);
    },
  });

  const counterValue = counter.data?.value ?? 0;
  const isAdjusting = increment.isPending;
  const adjust = (amount: -1 | 1) => {
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
  };

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
      timing={{ ...timing, syncMountedAt: syncMountedAt.current }}
    />
  );
}

function HomeShell({
  counterValue = 0,
  isAdjusting = true,
  onAdjust,
  timing,
}: {
  readonly counterValue?: number;
  readonly isAdjusting?: boolean;
  readonly onAdjust?: (amount: -1 | 1) => void;
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
        {showStartupTiming && timing ? <StartupTimingReadout timing={timing} /> : null}
      </section>
    </main>
  );
}

function StartupTimingReadout({ timing }: { readonly timing: StartupTiming }) {
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
            ? "Sync initializing"
            : `Sync ready in ${formatMs(totalReadyMs)}`}
      </span>
      <span aria-hidden>·</span>
      <span>session {formatTimingValue(authMs)}</span>
      <span aria-hidden>·</span>
      <span>anonymous auth {authFailed ? "failed" : formatTimingValue(anonymousAuthMs)}</span>
      <span aria-hidden>·</span>
      <span>counter {formatTimingValue(syncMs)}</span>
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

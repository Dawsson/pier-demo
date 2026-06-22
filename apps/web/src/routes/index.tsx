import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { endpointClient, syncClient, syncConfig } from "@/lib/api";
import { authClient } from "@/lib/auth";

const counterRateLimit = 20;
const counterRateLimitWindowMs = 60_000;

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const session = authClient.useSession();
  const anonymousSignInStarted = useRef(false);

  useEffect(() => {
    if (session.isPending || session.data?.user || anonymousSignInStarted.current) {
      return;
    }

    anonymousSignInStarted.current = true;
    void authClient.signIn.anonymous().finally(() => {
      anonymousSignInStarted.current = false;
    });
  }, [session.data?.user, session.isPending]);

  if (!session.data?.user) {
    return <HomeShell />;
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
      <HomeCounter />
    </SyncProvider>
  );
}

function HomeCounter() {
  const counter = syncClient.counter.current.useQuery();
  const queryErrorToastShown = useRef(false);
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
    if (!counter.isError || queryErrorToastShown.current) {
      return;
    }

    queryErrorToastShown.current = true;
    showCounterErrorToast(counter.error);
  }, [counter.error, counter.isError]);

  return <HomeShell counterValue={counterValue} isAdjusting={isAdjusting} onAdjust={adjust} />;
}

function HomeShell({
  counterValue = 0,
  isAdjusting = true,
  onAdjust,
}: {
  readonly counterValue?: number;
  readonly isAdjusting?: boolean;
  readonly onAdjust?: (amount: -1 | 1) => void;
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
      </section>
    </main>
  );
}

function showCounterErrorToast(error: unknown) {
  const message = errorMessage(error);
  const isRateLimited = /rate.?limit|too many|429/i.test(message);

  if (isRateLimited) {
    showCounterRateLimitToast();
    return;
  }

  toastManager.add({
    description: "The synced counter could not update.",
    id: "counter-sync-error",
    title: "Counter unavailable",
    type: "error",
  });
}

function showCounterRateLimitToast() {
  toastManager.add({
    description: "Give it a moment before counting again.",
    id: "counter-rate-limited",
    title: "Slow down",
    type: "warning",
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

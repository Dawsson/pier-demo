import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link } from "@tanstack/react-router";
import { useZero } from "@rocicorp/zero/react";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { syncClient, syncConfig } from "@/lib/api";
import { useCounterStore, type CounterAdjustAmount } from "@/lib/counter-store";
import type { PublicCounterInitialData } from "@/lib/counter-data";
import { Button } from "@repo/ui/button";
import { CounterControls } from "./counter-controls";
import { CounterValue } from "./counter-value";

export function HomePage({ initialData }: { readonly initialData: PublicCounterInitialData }) {
  const clearPendingAdjustment = useCounterStore((state) => state.clearPendingAdjustment);
  const pendingAdjustment = useCounterStore((state) => state.pendingAdjustment);
  const preparePending = useCounterStore((state) => state.preparePending);
  const prepareSession = useCounterStore((state) => state.prepareSession);
  const preparedSession = useCounterStore((state) => state.preparedSession);
  const queueAdjustment = useCounterStore((state) => state.queueAdjustment);
  const userId = preparedSession
    ? contract.clientContext.getUserID(preparedSession.user as never)
    : null;
  const context = useMemo(
    () =>
      preparedSession ? contract.clientContext.create(preparedSession.user as never) : undefined,
    [preparedSession],
  );

  useEffect(() => {
    if (initialData.hasSessionCookie) {
      void prepareSession(false).catch((error: unknown) => {
        toast.warning("Session unavailable", {
          description: error instanceof Error ? error.message : "Reload the page to try again.",
          id: "counter-session-error",
        });
      });
    }
  }, [initialData.hasSessionCookie, prepareSession]);

  const requestAdjustment = (amount: CounterAdjustAmount) => {
    queueAdjustment(amount);

    if (!preparedSession) {
      void prepareSession(true).catch((error: unknown) => {
        clearPendingAdjustment();
        toast.warning("Anonymous auth failed", {
          description: error instanceof Error ? error.message : "Reload the page to try again.",
          id: "counter-session-error",
        });
      });
    }
  };

  const page = (counterValue: number, isAdjusting = false) => (
    <main className="relative flex min-h-screen flex-col bg-background px-5 py-7 text-foreground sm:px-7">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <ThemeSwitcher />
          <Button render={<Link to="/auth/sign-in" />} size="sm" variant="ghost">
            Sign in
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

        <CounterControls
          isAdjusting={isAdjusting}
          onAdjust={requestAdjustment}
          onPrewarm={() => {
            if (!preparePending && !preparedSession) {
              void prepareSession(true).catch(() => undefined);
            }
          }}
        >
          <CounterValue value={counterValue} />
        </CounterControls>
      </section>
    </main>
  );

  if (!preparedSession || !context || !userId) {
    return page(initialData.counter.value);
  }

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
      <SyncedCounter
        initialCounterValue={initialData.counter.value}
        onAdjustmentSubmitted={clearPendingAdjustment}
        pendingAdjustment={pendingAdjustment}
        render={page}
      />
    </SyncProvider>
  );
}

function SyncedCounter({
  initialCounterValue,
  onAdjustmentSubmitted,
  pendingAdjustment,
  render,
}: {
  readonly initialCounterValue: number;
  readonly onAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: CounterAdjustAmount | null;
  readonly render: (counterValue: number, isAdjusting?: boolean) => ReactNode;
}) {
  const counter = syncClient.counter.current.useQuery();
  const zero = useZero();
  const increment = useCallback(
    (amount: CounterAdjustAmount) => {
      const startedAt = performance.now();
      const request = syncClient.mutators.counter.increment({ amount });
      const result = zero.mutate(request as Parameters<typeof zero.mutate>[0]);

      void result.client.then((clientResult) => {
        if (clientResult.type === "error") {
          showCounterMutationError(clientResult.error.message);
        }
      });

      void result.server.then((serverResult) => {
        if (serverResult.type === "error") {
          console.log(
            "counter.increment server error after",
            `${Math.round(performance.now() - startedAt)}ms`,
            serverResult.error.message,
          );
          showCounterMutationError(serverResult.error.message);
        }
      });
    },
    [zero],
  );

  useEffect(() => {
    if (pendingAdjustment === null) {
      return;
    }

    increment(pendingAdjustment);
    onAdjustmentSubmitted();
  }, [increment, onAdjustmentSubmitted, pendingAdjustment]);

  useEffect(() => {
    if (counter.isError) {
      toast.error("Counter unavailable", {
        description: "The synced counter could not load.",
        id: "counter-sync-error",
      });
    }
  }, [counter.isError]);

  return render(counter.data?.value ?? initialCounterValue, false);
}

function showCounterMutationError(message: string) {
  if (/rate.?limit|too many|429/i.test(message)) {
    toast.warning("Slow down", {
      description: "Give it a moment before counting again.",
      id: "counter-rate-limited",
    });
    return;
  }

  toast.error("Counter unavailable", {
    description: "The synced counter could not update.",
    id: "counter-sync-error",
  });
}

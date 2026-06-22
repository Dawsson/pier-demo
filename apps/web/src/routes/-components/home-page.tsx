import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { syncClient, syncConfig } from "@/lib/api";
import type { PublicCounterInitialData } from "@/lib/counter-data";
import { prepareSyncSession, type PreparedSyncSession } from "@/lib/sync-session";
import { Button } from "@repo/ui/button";
import { CounterControls } from "./counter-controls";
import { CounterValue } from "./counter-value";

type CounterAdjustAmount = -1 | 1;

export function HomePage({ initialData }: { readonly initialData: PublicCounterInitialData }) {
  const [pendingAdjustment, setPendingAdjustment] = useState<CounterAdjustAmount | null>(null);
  const [preparePending, setPreparePending] = useState(initialData.hasSessionCookie);
  const [preparedSession, setPreparedSession] = useState<PreparedSyncSession | null>(null);
  const preparePromiseRef = useRef<Promise<PreparedSyncSession | null> | null>(null);
  const userId = preparedSession
    ? contract.clientContext.getUserID(preparedSession.user as never)
    : null;
  const context = useMemo(
    () =>
      preparedSession ? contract.clientContext.create(preparedSession.user as never) : undefined,
    [preparedSession],
  );

  const prepareSession = (createAnonymous: boolean) => {
    if (preparedSession) {
      return Promise.resolve(preparedSession);
    }

    if (preparePromiseRef.current) {
      return preparePromiseRef.current;
    }

    setPreparePending(true);

    const promise = prepareSyncSession({ createAnonymous })
      .then((session) => {
        if (session) {
          setPreparedSession(session);
        }

        return session;
      })
      .catch((error) => {
        setPendingAdjustment(null);
        toast.warning(createAnonymous ? "Anonymous auth failed" : "Session unavailable", {
          description: error instanceof Error ? error.message : "Reload the page to try again.",
          id: "counter-session-error",
        });

        return null;
      })
      .finally(() => {
        preparePromiseRef.current = null;
        setPreparePending(false);
      });

    preparePromiseRef.current = promise;
    return promise;
  };

  useEffect(() => {
    if (initialData.hasSessionCookie) {
      void prepareSession(false);
    }
    // Only hydrate an existing session once on page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestAdjustment = (amount: CounterAdjustAmount) => {
    if (!preparedSession) {
      setPendingAdjustment(amount);
      void prepareSession(true);
      return;
    }

    setPendingAdjustment(amount);
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
              void prepareSession(true);
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
        onAdjustmentSubmitted={() => setPendingAdjustment(null)}
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
  const increment = syncClient.counter.increment.useMutation({
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);

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
    },
  });

  useEffect(() => {
    if (pendingAdjustment === null) {
      return;
    }

    increment.mutate({ amount: pendingAdjustment });
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

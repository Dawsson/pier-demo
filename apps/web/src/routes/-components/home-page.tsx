import { Link, Navigate, getRouteApi } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { syncClient } from "@/lib/api";
import type { PublicCounterInitialData } from "@/lib/counter-data";
import { Button } from "@repo/ui/button";
import { CounterControls, type CounterAdjustAmount } from "./counter-controls";
import { CounterValue } from "./counter-value";

const rootRoute = getRouteApi("__root__");

export function HomePage({ initialData }: { readonly initialData: PublicCounterInitialData }) {
  const syncSession = rootRoute.useLoaderData();

  if (!syncSession) {
    return <Navigate replace to="/auth/sign-in" />;
  }

  return <SyncedCounter initialCounter={initialData.counter} render={CounterPage} />;
}

const CounterPage = (
  counterValue: number,
  isAdjusting = false,
  onAdjust: (amount: CounterAdjustAmount) => void,
) => (
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

      <CounterControls isAdjusting={isAdjusting} onAdjust={onAdjust}>
        <CounterValue value={counterValue} />
      </CounterControls>
    </section>
  </main>
);

function SyncedCounter({
  initialCounter,
  render,
}: {
  readonly initialCounter: PublicCounterInitialData["counter"];
  readonly render: (
    counterValue: number,
    isAdjusting: boolean,
    onAdjust: (amount: CounterAdjustAmount) => void,
  ) => ReactNode;
}) {
  const counter = syncClient.counter.current.useQuery({
    initialData: {
      id: "global",
      updatedAt: initialCounter.updatedAt,
      value: initialCounter.value,
    },
    onError: () => {
      toast.error("Counter unavailable", {
        description: "The synced counter could not load.",
        id: "counter-sync-error",
      });
    },
  });
  const increment = syncClient.counter.increment.useMutation({
    onError: showCounterMutationError,
    onServerError: showCounterMutationError,
  });

  return render(counter.data.value, increment.isPending, (amount) => {
    increment.mutate({ amount });
  });
}

function showCounterMutationError(error: Error) {
  if (/rate.?limit|too many|429/i.test(error.message)) {
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

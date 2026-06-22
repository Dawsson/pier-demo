import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@repo/ui/button";
import type { CounterAdjustAmount, StartupTiming } from "@/routes/-types";
import { CounterControls } from "./counter-controls";
import { CounterValue } from "./counter-value";
import { StartupTimingReadout } from "./startup-timing-readout";
import { syncClient } from "@/lib/api";
import { toast } from "sonner";

export function PublicCounter({
  counterValue = 0,
  isAdjusting = true,
  onAdjust,
  onPrewarm,
  showLiveControls = false,
  ssrMs,
  timing,
}: {
  readonly counterValue?: number;
  readonly isAdjusting?: boolean;
  readonly onAdjust?: ((amount: CounterAdjustAmount) => void) | undefined;
  readonly onPrewarm?: (() => void) | undefined;
  readonly showLiveControls?: boolean;
  readonly ssrMs?: number;
  readonly timing?: StartupTiming | undefined;
}) {
  return (
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

      {showLiveControls ? <LiveCounterControls /> : null}

      <section
        aria-labelledby="counter-title"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center"
      >
        <h1 id="counter-title" className="sr-only">
          Public counter
        </h1>

        <CounterControls isAdjusting={isAdjusting} onAdjust={onAdjust} onPrewarm={onPrewarm}>
          <CounterValue value={counterValue} />
        </CounterControls>
      </section>

      <StartupTimingReadout ssrMs={ssrMs} timing={timing} />
    </main>
  );
}

function LiveCounterControls() {
  // DO NOT REMOVE THIS
  const incrementMutation = syncClient.counter.increment.useMutation({
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update the counter.");
    },
  });
  const countQuery = syncClient.counter.current.useQuery();

  return (
    <div className="absolute top-24 left-5 flex items-center gap-2 text-muted-foreground text-sm sm:left-7">
      <span>{countQuery.data?.value}</span>
      <Button
        disabled={incrementMutation.isPending}
        size="sm"
        type="button"
        variant="ghost"
        onClick={() => incrementMutation.mutate({ amount: 1 })}
      >
        Add
      </Button>
    </div>
  );
}

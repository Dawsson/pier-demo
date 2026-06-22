import { Link, createFileRoute } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { rpcClient } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const counter = rpcClient.publicCounter.current.useQuery({
    retry: false,
  });
  const adjustCounter = rpcClient.publicCounter.adjust.useMutation({
    onSuccess: async () => {
      await counter.refetch();
    },
  });
  const counterValue = adjustCounter.data?.value ?? counter.data?.value ?? 0;
  const isAdjusting = adjustCounter.isPending;
  const adjust = (amount: -1 | 1) => {
    adjustCounter.mutate({ amount });
  };

  return (
    <main className="flex min-h-screen flex-col gap-14 bg-background px-5 py-7 text-foreground sm:px-7">
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
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 text-center"
      >
        <div className="grid gap-3">
          <p className="font-semibold text-muted-foreground text-sm">Pier Demo</p>
          <h1 id="counter-title" className="font-bold text-3xl tracking-normal sm:text-4xl">
            A simple shared counter.
          </h1>
        </div>

        <div className="grid grid-cols-[3.25rem_minmax(7rem,1fr)_3.25rem] items-center gap-4 sm:grid-cols-[4rem_minmax(10rem,1fr)_4rem] sm:gap-6">
          <Button
            aria-label="Decrease counter"
            className="size-13 rounded-full sm:size-16"
            disabled={isAdjusting}
            size="icon"
            type="button"
            variant="secondary"
            onClick={() => adjust(-1)}
          >
            <Minus aria-hidden />
          </Button>

          <span
            key={counterValue}
            aria-live="polite"
            className="min-w-0 animate-in fade-in zoom-in-95 font-black text-[clamp(5rem,18vw,10rem)] leading-none tabular-nums duration-200"
          >
            {counterValue}
          </span>

          <Button
            aria-label="Increase counter"
            className="size-13 rounded-full sm:size-16"
            disabled={isAdjusting}
            size="icon"
            type="button"
            onClick={() => adjust(1)}
          >
            <Plus aria-hidden />
          </Button>
        </div>

        <p className="min-h-5 text-muted-foreground text-sm">
          {adjustCounter.error ? "Could not update the counter. Try again." : "Public counter"}
        </p>
      </section>
    </main>
  );
}

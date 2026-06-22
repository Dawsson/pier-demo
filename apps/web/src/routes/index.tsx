import { Link, createFileRoute } from "@tanstack/react-router";
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_srgb,var(--muted),var(--background)_52%)_100%)] px-5 py-7 text-foreground sm:px-7">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35 dark:opacity-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent"
        aria-hidden
      />

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
        className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-7 text-center"
      >
        <div className="grid gap-2">
          <p className="font-medium text-muted-foreground text-xs uppercase">Public counter</p>
          <h1 id="counter-title" className="font-semibold text-xl tracking-normal sm:text-2xl">
            Click it up or down.
          </h1>
        </div>

        <div className="grid w-full grid-cols-[4rem_minmax(8rem,1fr)_4rem] items-center gap-3 sm:grid-cols-[5rem_minmax(12rem,1fr)_5rem] sm:gap-8">
          <Button
            aria-label="Decrease counter"
            className="h-24 w-full rounded-none border-border bg-background/80 px-0 text-4xl text-muted-foreground shadow-none backdrop-blur-sm hover:bg-foreground hover:text-background sm:h-32 sm:text-5xl dark:bg-background/70"
            disabled={isAdjusting}
            type="button"
            variant="secondary"
            onClick={() => adjust(-1)}
          >
            <span aria-hidden className="-translate-y-0.5">
              −
            </span>
          </Button>

          <span
            key={counterValue}
            aria-live="polite"
            className="min-w-0 animate-in fade-in slide-in-from-bottom-2 font-black text-8xl leading-[0.82] tabular-nums duration-200 sm:text-[10rem] md:text-[12rem] lg:text-[13rem]"
          >
            {counterValue}
          </span>

          <Button
            aria-label="Increase counter"
            className="h-24 w-full rounded-none bg-foreground px-0 text-4xl text-background shadow-none hover:bg-foreground/88 sm:h-32 sm:text-5xl"
            disabled={isAdjusting}
            type="button"
            onClick={() => adjust(1)}
          >
            <span aria-hidden className="-translate-y-0.5">
              +
            </span>
          </Button>
        </div>

        <p className="min-h-5 text-muted-foreground text-xs">
          {adjustCounter.error ? "Could not update the counter." : null}
        </p>
      </section>
    </main>
  );
}

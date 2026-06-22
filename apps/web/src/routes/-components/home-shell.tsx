import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

const showStartupTiming = import.meta.env.DEV;

const now = () => (typeof performance === "undefined" ? 0 : performance.now());

export type HomeShellTiming = {
  readonly anonymousAuthEndAt?: number;
  readonly anonymousAuthFailedAt?: number;
  readonly anonymousAuthStartAt?: number;
  readonly counterReadyAt?: number;
  readonly sessionReadyAt?: number;
  readonly startedAt: number;
  readonly syncMountedAt?: number;
};

export function HomeShell({
  counterValue = 0,
  isAdjusting = true,
  onAdjust,
  onPrewarm,
  ssrMs,
  timing,
}: {
  readonly counterValue?: number;
  readonly isAdjusting?: boolean;
  readonly onAdjust?: (amount: -1 | 1) => void;
  readonly onPrewarm?: () => void;
  readonly ssrMs?: number;
  readonly timing?: HomeShellTiming;
}) {
  const prewarmIntent = useHoverIntentPrewarm(onPrewarm);

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

      <section
        aria-labelledby="counter-title"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center"
      >
        <h1 id="counter-title" className="sr-only">
          Public counter
        </h1>

        <div className="grid w-full grid-cols-[3.25rem_minmax(8rem,auto)_3.25rem] items-center justify-center gap-5 sm:grid-cols-[4rem_minmax(12rem,auto)_4rem] sm:gap-6">
          <Button
            aria-label="Decrease counter"
            className="size-13 rounded-full p-0 text-3xl sm:size-16 sm:text-4xl"
            disabled={isAdjusting || !onAdjust}
            size="icon-xl"
            type="button"
            variant="outline"
            onClick={() => onAdjust?.(-1)}
            onFocus={prewarmIntent.onFocus}
            onPointerEnter={prewarmIntent.onPointerEnter}
            onPointerLeave={prewarmIntent.onPointerLeave}
            onPointerMove={prewarmIntent.onPointerMove}
            onTouchStart={prewarmIntent.onTouchStart}
          >
            <span aria-hidden className="-translate-y-0.5">
              −
            </span>
          </Button>

          <CounterValue value={counterValue} />

          <Button
            aria-label="Increase counter"
            className="size-13 rounded-full p-0 text-3xl sm:size-16 sm:text-4xl"
            disabled={isAdjusting || !onAdjust}
            size="icon-xl"
            type="button"
            variant="outline"
            onClick={() => onAdjust?.(1)}
            onFocus={prewarmIntent.onFocus}
            onPointerEnter={prewarmIntent.onPointerEnter}
            onPointerLeave={prewarmIntent.onPointerLeave}
            onPointerMove={prewarmIntent.onPointerMove}
            onTouchStart={prewarmIntent.onTouchStart}
          >
            <span aria-hidden className="-translate-y-0.5">
              +
            </span>
          </Button>
        </div>
      </section>

      {showStartupTiming && timing ? <StartupTimingReadout ssrMs={ssrMs} timing={timing} /> : null}
    </main>
  );
}

function useHoverIntentPrewarm(onPrewarm: (() => void) | undefined) {
  const fired = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const lastPointer = useRef<{
    readonly at: number;
    readonly x: number;
    readonly y: number;
  } | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current === null) {
      return;
    }

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const prewarm = useCallback(() => {
    if (!onPrewarm || fired.current) {
      return;
    }

    fired.current = true;
    clearPending();
    onPrewarm();
  }, [clearPending, onPrewarm]);

  const schedule = useCallback(
    (delayMs: number) => {
      if (!onPrewarm || fired.current || timeoutRef.current !== null) {
        return;
      }

      timeoutRef.current = window.setTimeout(prewarm, delayMs);
    },
    [onPrewarm, prewarm],
  );

  return {
    onFocus: prewarm,
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        prewarm();
        return;
      }

      lastPointer.current = {
        at: now(),
        x: event.clientX,
        y: event.clientY,
      };
      schedule(80);
    },
    onPointerLeave: clearPending,
    onPointerMove: (event: React.PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      const previous = lastPointer.current;
      const current = {
        at: now(),
        x: event.clientX,
        y: event.clientY,
      };
      lastPointer.current = current;

      if (!previous) {
        return;
      }

      const elapsed = Math.max(1, current.at - previous.at);
      const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
      const pixelsPerMs = distance / elapsed;

      if (pixelsPerMs < 0.55) {
        prewarm();
      }
    },
    onTouchStart: prewarm,
  };
}

function CounterValue({ value }: { readonly value: number }) {
  const previousValue = useRef(value);
  const direction = value >= previousValue.current ? "up" : "down";
  const characters = String(value).split("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  const distance = direction === "up" ? "0.72em" : "-0.72em";
  const exitDistance = direction === "up" ? "-0.72em" : "0.72em";

  return (
    <span
      aria-label={String(value)}
      aria-live="polite"
      className="flex min-w-[2ch] justify-center overflow-hidden px-1 font-semibold text-8xl leading-none tabular-nums sm:text-[8rem] md:text-[9rem]"
    >
      {characters.map((character, index) => {
        return (
          <span
            aria-hidden
            className="relative inline-grid h-[1em] w-[0.58em] place-items-center overflow-hidden"
            key={index}
          >
            <span className="invisible leading-none">{character}</span>
            <AnimatePresence initial={false}>
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 grid place-items-center leading-none"
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: exitDistance }}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: distance }}
                key={`${index}-${character}`}
                transition={{
                  bounce: 0.22,
                  duration: 0.28,
                  type: "spring",
                }}
              >
                {character}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}

function StartupTimingReadout({
  ssrMs,
  timing,
}: {
  readonly ssrMs: number | undefined;
  readonly timing: HomeShellTiming;
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
    <div className="absolute bottom-5 left-5 flex flex-col items-start gap-1 text-left text-xs text-muted-foreground sm:bottom-7 sm:left-7">
      <span className="font-medium text-foreground">
        {authFailed
          ? "Anonymous auth blocked"
          : totalReadyMs === undefined
            ? "SSR value ready"
            : `Live sync ready in ${formatMs(totalReadyMs)}`}
      </span>
      <span>ssr {formatTimingValue(ssrMs)}</span>
      <span>session {formatTimingValue(authMs)}</span>
      <span>
        guest auth{" "}
        {authFailed
          ? "failed"
          : anonymousAuthMs === undefined
            ? "deferred"
            : formatTimingValue(anonymousAuthMs)}
      </span>
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

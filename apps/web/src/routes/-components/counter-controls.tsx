import { Button } from "@repo/ui/button";
import { useHoverIntentPrewarm } from "@/lib/use-hover-intent-prewarm";
import type { CounterAdjustAmount } from "@/routes/-types";
import type { ReactNode } from "react";

export function CounterControls({
  children,
  isAdjusting,
  onAdjust,
  onPrewarm,
}: {
  readonly children: ReactNode;
  readonly isAdjusting: boolean;
  readonly onAdjust: ((amount: CounterAdjustAmount) => void) | undefined;
  readonly onPrewarm: (() => void) | undefined;
}) {
  const prewarmIntent = useHoverIntentPrewarm(onPrewarm);

  return (
    <div className="grid w-full grid-cols-[3.25rem_minmax(9rem,auto)_3.25rem] items-center justify-center gap-8 sm:grid-cols-[4.5rem_minmax(14rem,auto)_4.5rem] sm:gap-12 md:gap-16">
      <Button
        aria-label="Decrease counter"
        className="size-13 rounded-full border-border/60 p-0 text-3xl shadow-none before:rounded-full hover:border-foreground/20 hover:bg-accent/70 sm:size-18 sm:text-4xl dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/7"
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

      {children}

      <Button
        aria-label="Increase counter"
        className="size-13 rounded-full border-border/60 p-0 text-3xl shadow-none before:rounded-full hover:border-foreground/20 hover:bg-accent/70 sm:size-18 sm:text-4xl dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/7"
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
  );
}

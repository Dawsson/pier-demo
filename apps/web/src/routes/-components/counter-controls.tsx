import { Button } from "@/components/ui/button";
import { useHoverIntentPrewarm } from "../-hooks/use-hover-intent-prewarm";
import type { CounterAdjustAmount } from "../-types";

export function CounterControls({
  isAdjusting,
  onAdjust,
  onPrewarm,
}: {
  readonly isAdjusting: boolean;
  readonly onAdjust?: (amount: CounterAdjustAmount) => void;
  readonly onPrewarm?: () => void;
}) {
  const prewarmIntent = useHoverIntentPrewarm(onPrewarm);

  return (
    <>
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
    </>
  );
}

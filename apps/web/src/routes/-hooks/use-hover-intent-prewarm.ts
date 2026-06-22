import { useCallback, useRef } from "react";
import { now } from "../-helpers";

export function useHoverIntentPrewarm(onPrewarm: (() => void) | undefined) {
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

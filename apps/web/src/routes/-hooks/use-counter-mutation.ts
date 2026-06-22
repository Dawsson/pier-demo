import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { syncClient } from "@/lib/api";
import { errorMessage, now } from "@/routes/-helpers";
import type { CounterAdjustAmount, PendingAdjustment } from "@/routes/-types";

export function useCounterMutation({
  initialCounterValue,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
}: {
  readonly initialCounterValue: number;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
}) {
  const counter = syncClient.counter.current.useQuery();
  const syncMountedAt = useRef(now());
  const submittedPendingAdjustmentId = useRef<string | null>(null);
  const increment = syncClient.counter.increment.useMutation({
    onError: showCounterErrorToast,
  });

  const counterValue = counter.data?.value ?? initialCounterValue;
  const adjust = useCallback(
    (amount: CounterAdjustAmount) => {
      increment.mutate({ amount });
    },
    [increment],
  );

  useEffect(() => {
    if (
      !pendingAdjustment ||
      submittedPendingAdjustmentId.current === pendingAdjustment.id ||
      increment.isPending
    ) {
      return;
    }

    submittedPendingAdjustmentId.current = pendingAdjustment.id;
    adjust(pendingAdjustment.amount);
    onPendingAdjustmentSubmitted();
  }, [adjust, increment.isPending, pendingAdjustment, onPendingAdjustmentSubmitted]);

  useEffect(() => {
    if (counter.data === undefined) {
      return;
    }

    onCounterReady(now());
  }, [counter.data, onCounterReady]);

  useEffect(() => {
    if (counter.isError) {
      showCounterErrorToast(counter.error);
    }
  }, [counter.error, counter.isError]);

  return {
    adjust,
    counterValue,
    syncMountedAt: syncMountedAt.current,
  };
}

function showCounterErrorToast(error: unknown) {
  const message = errorMessage(error);
  const isRateLimited = /rate.?limit|too many|429/i.test(message);

  if (isRateLimited) {
    showCounterRateLimitToast();
    return;
  }

  toast.error("Counter unavailable", {
    description: "The synced counter could not update.",
    id: "counter-sync-error",
  });
}

function showCounterRateLimitToast() {
  toast.warning("Slow down", {
    description: "Give it a moment before counting again.",
    id: "counter-rate-limited",
  });
}

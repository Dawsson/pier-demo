import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { useCallback, useMemo, useState } from "react";
import { syncClient, syncConfig } from "@/lib/api";
import type { PublicCounterInitialData } from "@/lib/counter-data";
import type { PreparedSyncSession } from "@/lib/sync-session";
import { useCounterMutation } from "@/routes/-hooks/use-counter-mutation";
import { useCounterSession } from "@/routes/-hooks/use-counter-session";
import type { CounterAdjustAmount, PendingAdjustment, StartupTiming } from "@/routes/-types";
import { PublicCounter } from "./public-counter";

export function HomePage({ initialData }: { readonly initialData: PublicCounterInitialData }) {
  const [pendingAdjustment, setPendingAdjustment] = useState<PendingAdjustment | null>(null);
  const session = useCounterSession({
    hasSessionCookie: initialData.hasSessionCookie,
    onInteractiveAuthError: () => setPendingAdjustment(null),
  });
  const { counterReadyAt: existingCounterReadyAt } = session.timing;
  const { updateTiming } = session;
  const reportCounterReady = useCallback(
    (counterReadyAt: number) => {
      if (existingCounterReadyAt !== undefined) {
        return;
      }

      updateTiming({ counterReadyAt });
    },
    [existingCounterReadyAt, updateTiming],
  );

  const requestAdjustment = (amount: CounterAdjustAmount) => {
    setPendingAdjustment({ amount, id: crypto.randomUUID() });

    if (!session.preparedSession && !session.preparePending) {
      void session.prepareGuestSession({ interactive: true });
    }
  };

  if (!session.preparedSession) {
    return (
      <PublicCounter
        counterValue={initialData.counter.value}
        isAdjusting={false}
        onAdjust={requestAdjustment}
        onPrewarm={() => {
          if (!session.preparePending) {
            void session.prepareGuestSession({ interactive: false });
          }
        }}
        timing={session.timing}
        ssrMs={initialData.ssrMs}
      />
    );
  }

  return (
    <SyncedCounterRoot
      initialData={initialData}
      onCounterReady={reportCounterReady}
      onPendingAdjustmentSubmitted={() => setPendingAdjustment(null)}
      pendingAdjustment={pendingAdjustment}
      preparedSession={session.preparedSession}
      timing={session.timing}
    />
  );
}

function SyncedCounterRoot({
  initialData,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
  preparedSession,
  timing,
}: {
  readonly initialData: PublicCounterInitialData;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
  readonly preparedSession: PreparedSyncSession;
  readonly timing: StartupTiming;
}) {
  const userId = contract.clientContext.getUserID(preparedSession.user as never);
  const context = useMemo(
    () => contract.clientContext.create(preparedSession.user as never),
    [preparedSession],
  );

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
        onCounterReady={onCounterReady}
        onPendingAdjustmentSubmitted={onPendingAdjustmentSubmitted}
        pendingAdjustment={pendingAdjustment}
        timing={timing}
        ssrMs={initialData.ssrMs}
      />
    </SyncProvider>
  );
}

function SyncedCounter({
  initialCounterValue,
  onCounterReady,
  onPendingAdjustmentSubmitted,
  pendingAdjustment,
  ssrMs,
  timing,
}: {
  readonly initialCounterValue: number;
  readonly onCounterReady: (counterReadyAt: number) => void;
  readonly onPendingAdjustmentSubmitted: () => void;
  readonly pendingAdjustment: PendingAdjustment | null;
  readonly ssrMs: number;
  readonly timing: StartupTiming;
}) {
  const counter = useCounterMutation({
    initialCounterValue,
    onCounterReady,
    onPendingAdjustmentSubmitted,
    pendingAdjustment,
  });

  return (
    <PublicCounter
      counterValue={counter.counterValue}
      isAdjusting={false}
      onAdjust={counter.adjust}
      ssrMs={ssrMs}
      timing={{ ...timing, syncMountedAt: counter.syncMountedAt }}
    />
  );
}

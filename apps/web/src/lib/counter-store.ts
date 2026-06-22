import { create } from "zustand";
import { prepareSyncSession, type PreparedSyncSession } from "@/lib/sync-session";

export type CounterAdjustAmount = -1 | 1;

type CounterState = {
  pendingAdjustment: CounterAdjustAmount | null;
  preparePending: boolean;
  preparedSession: PreparedSyncSession | null;
  clearPendingAdjustment: () => void;
  prepareSession: (createAnonymous: boolean) => Promise<PreparedSyncSession | null>;
  queueAdjustment: (amount: CounterAdjustAmount) => void;
};

let preparePromise: Promise<PreparedSyncSession | null> | null = null;

export const useCounterStore = create<CounterState>((set, get) => ({
  pendingAdjustment: null,
  preparePending: false,
  preparedSession: null,
  clearPendingAdjustment: () => set({ pendingAdjustment: null }),
  prepareSession: (createAnonymous) => {
    const { preparedSession } = get();

    if (preparedSession) {
      return Promise.resolve(preparedSession);
    }

    if (preparePromise) {
      return preparePromise;
    }

    set({ preparePending: true });

    preparePromise = prepareSyncSession({ createAnonymous })
      .then((session) => {
        if (session) {
          set({ preparedSession: session });
        }

        return session;
      })
      .finally(() => {
        preparePromise = null;
        set({ preparePending: false });
      });

    return preparePromise;
  },
  queueAdjustment: (amount) => set({ pendingAdjustment: amount }),
}));

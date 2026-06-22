import { create } from "zustand";
import type { PreparedSyncSession } from "@/lib/sync-session";

export type CounterAdjustAmount = -1 | 1;

type CounterState = {
  preparedSession: PreparedSyncSession | null;
  setPreparedSession: (session: PreparedSyncSession) => void;
};

export const useCounterStore = create<CounterState>((set) => ({
  preparedSession: null,
  setPreparedSession: (session) => set({ preparedSession: session }),
}));

import { create } from "zustand";
import type { PreparedSyncSession } from "@/lib/sync-session";

export type CounterAdjustAmount = -1 | 1;

type CounterState = {
  syncSession: PreparedSyncSession | null;
  setSyncSession: (session: PreparedSyncSession | null) => void;
};

export const useCounterStore = create<CounterState>((set) => ({
  syncSession: null,
  setSyncSession: (session) => set({ syncSession: session }),
}));

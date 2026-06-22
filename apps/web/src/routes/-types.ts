export type CounterAdjustAmount = -1 | 1;

export type PendingAdjustment = {
  readonly amount: CounterAdjustAmount;
  readonly id: string;
};

export type StartupTiming = {
  readonly anonymousAuthEndAt?: number;
  readonly anonymousAuthFailedAt?: number;
  readonly anonymousAuthStartAt?: number;
  readonly counterReadyAt?: number;
  readonly sessionReadyAt?: number;
  readonly startedAt: number;
  readonly syncMountedAt?: number;
};

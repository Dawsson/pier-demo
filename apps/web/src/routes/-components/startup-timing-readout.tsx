import type { StartupTiming } from "@/routes/-types";

const showStartupTiming = import.meta.env.DEV;

export function StartupTimingReadout({
  ssrMs,
  timing,
}: {
  readonly ssrMs: number | undefined;
  readonly timing: StartupTiming | undefined;
}) {
  if (!showStartupTiming || !timing) {
    return null;
  }

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

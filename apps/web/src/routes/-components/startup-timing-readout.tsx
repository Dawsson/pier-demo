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
  const rows = [
    {
      label: "Ready",
      value: totalReadyMs === undefined ? "SSR" : formatMs(totalReadyMs),
    },
    {
      label: "SSR",
      value: formatTimingValue(ssrMs),
    },
    {
      label: "Session",
      value: formatTimingValue(authMs),
    },
    {
      label: "Guest",
      value: authFailed
        ? "Failed"
        : anonymousAuthMs === undefined
          ? "On demand"
          : formatMs(anonymousAuthMs),
    },
    {
      label: "Sync",
      value: formatTimingValue(syncMs),
    },
  ];

  return (
    <div className="absolute bottom-5 left-5 grid grid-cols-[4.25rem_5.75rem] gap-x-2 gap-y-1 text-left text-xs tabular-nums sm:bottom-7 sm:left-7">
      {rows.map((row) => (
        <div className="contents" key={row.label}>
          <span className="text-muted-foreground">{row.label}:</span>
          <span className="text-foreground/85">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatTimingValue(value: number | undefined) {
  return value === undefined ? "Pending" : formatMs(value);
}

function formatMs(value: number) {
  return `${Math.max(0, Math.round(value))}ms`;
}

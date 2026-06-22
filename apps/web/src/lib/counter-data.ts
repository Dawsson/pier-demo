import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { rpcClient } from "@/lib/api";
import { hasBetterAuthSessionCookie } from "@/lib/session";

export type PublicCounterInitialData = {
  readonly counter: Awaited<ReturnType<typeof rpcClient.publicCounter.current.call>>;
  readonly hasSessionCookie: boolean;
  readonly loadedAt: number;
  readonly ssrMs: number;
};

export const getPublicCounterServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const startedAt = performance.now();
  const counter = await rpcClient.publicCounter.current.call({});
  const ssrMs = Math.round(performance.now() - startedAt);

  if (import.meta.env.DEV || ssrMs >= 100) {
    console.log(
      JSON.stringify({
        event: "public_counter_ssr_timing",
        ssrMs,
        value: counter.value,
      }),
    );
  }

  return {
    counter,
    hasSessionCookie: hasBetterAuthSessionCookie(getRequest().headers.get("cookie")),
    loadedAt: Date.now(),
    ssrMs,
  };
});

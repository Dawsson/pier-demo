import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { rpcClient } from "@/lib/api";
import { hasBetterAuthSessionCookie } from "@/lib/session";

export type PublicCounterInitialData = {
  readonly counter: Awaited<ReturnType<typeof rpcClient.publicCounter.current.call>>;
  readonly hasSessionCookie: boolean;
};

export const getPublicCounterServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const counter = await rpcClient.publicCounter.current.call({});

  return {
    counter,
    hasSessionCookie: hasBetterAuthSessionCookie(getRequest().headers.get("cookie")),
  };
});

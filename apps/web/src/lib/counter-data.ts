import { createServerFn } from "@tanstack/react-start";
import { getRequest, getResponseHeaders } from "@tanstack/react-start/server";
import { endpointClient, rpcClient } from "@/lib/api";
import { errorMessage, readSetCookieHeaders, type PreparedSyncSession } from "@/lib/sync-session";

export type PublicCounterInitialData = {
  readonly counter: Awaited<ReturnType<typeof rpcClient.publicCounter.current.call>>;
  readonly syncSession: PreparedSyncSession;
};

export const getPublicCounterServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const [counter, syncSession] = await Promise.all([
    rpcClient.publicCounter.current.call({}),
    preparePublicSyncSession(),
  ]);

  return {
    counter,
    syncSession,
  };
});

async function preparePublicSyncSession() {
  const response = await fetch(endpointClient.syncSession.prepare.href({ createAnonymous: true }), {
    body: JSON.stringify({ createAnonymous: true }),
    headers: {
      "content-type": "application/json",
      cookie: getRequest().headers.get("cookie") ?? "",
    },
    method: "POST",
  });

  for (const cookie of readSetCookieHeaders(response.headers)) {
    getResponseHeaders().append("set-cookie", cookie);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(errorMessage(body) ?? "Could not prepare sync session.");
  }

  return (await response.json()) as PreparedSyncSession;
}

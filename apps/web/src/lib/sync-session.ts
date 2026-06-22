import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { syncSessionOutputSchema, type SyncSessionOutput } from "@pier-demo/api-contract/schemas";
import { endpointClient } from "@/lib/api";
import { httpErrorMessage } from "@/lib/http-error-message";

export type PreparedSyncSession = SyncSessionOutput;

export const getSyncSessionServerFn = createServerFn({ method: "GET" }).handler(async () => {
  const response = await fetch(endpointClient.syncSession.current.href({}), {
    body: JSON.stringify({}),
    headers: {
      "content-type": "application/json",
      cookie: getRequest().headers.get("cookie") ?? "",
    },
    method: "POST",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(httpErrorMessage(body) ?? "Could not read sync session.");
  }

  return syncSessionOutputSchema.parse(await response.json());
});

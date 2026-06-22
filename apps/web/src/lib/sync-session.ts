import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { endpointClient } from "@/lib/api";

export type PreparedSyncSession = {
  readonly auth: {
    readonly expiresAt: number;
    readonly token: string;
    readonly userId: string;
  };
  readonly user: {
    readonly email?: string;
    readonly id: string;
    readonly isAnonymous?: boolean;
    readonly name?: string;
  };
};

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
    throw new Error(errorMessage(body) ?? "Could not read sync session.");
  }

  return (await response.json()) as PreparedSyncSession;
});

export function errorMessage(body: unknown) {
  if (typeof body !== "object" || body === null) {
    return;
  }

  const error = (body as { readonly error?: unknown }).error;
  if (typeof error === "object" && error !== null) {
    const message = (error as { readonly message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  const message = (body as { readonly message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

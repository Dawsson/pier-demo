import { endpointClient } from "@/lib/api";

export type PreparedSyncSession = {
  readonly auth: {
    readonly expiresAt: number;
    readonly token: string;
    readonly userId: string;
  };
  readonly user: {
    readonly id: string;
    readonly [key: string]: unknown;
  };
};

export async function prepareSyncSession(input: {
  readonly createAnonymous: boolean;
}): Promise<PreparedSyncSession | null> {
  const response = await fetch(endpointClient.syncSession.prepare.href(input), {
    body: JSON.stringify(input),
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (response.status === 401 && !input.createAnonymous) {
    return null;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(errorMessage(body) ?? "Could not prepare sync session.");
  }

  return (await response.json()) as PreparedSyncSession;
}

function errorMessage(body: unknown) {
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

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

export function readSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === "function" ? getSetCookie.call(headers) : [];

  if (cookies.length > 0) {
    return cookies;
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

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

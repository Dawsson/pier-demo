import { createServerFn } from "@tanstack/react-start";

const sessionCookieName = "better-auth.session_token";

const hasBetterAuthSessionCookie = (cookie: string | null) =>
  cookie?.split(";").some((part) => {
    const name = part.trim().split("=", 1)[0];

    return (
      name === sessionCookieName ||
      name === `__Secure-${sessionCookieName}` ||
      name === `__Host-${sessionCookieName}`
    );
  }) ?? false;

export const hasServerSessionCookie = createServerFn({ method: "GET" }).handler(({ context }) => {
  const request = (context as { readonly request?: Request }).request;
  if (!request) {
    return false;
  }

  return hasBetterAuthSessionCookie(request.headers.get("cookie"));
});

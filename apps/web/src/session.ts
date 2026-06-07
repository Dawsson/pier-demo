import { createServerFn } from "@tanstack/react-start";
import { serverEnv } from "./.waypoint/env";

export const hasServerSession = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const request = (context as { readonly request?: Request }).request;
  if (!request) {
    return false;
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return false;
  }

  const response = await fetch(`${serverEnv.PUBLIC_API_URL.href}/auth/get-session`, {
    headers: { cookie },
  }).catch(() => null);

  return Boolean(response?.ok && (await response.json().catch(() => null)));
});

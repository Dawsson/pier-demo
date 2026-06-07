import { createServerFn } from "@tanstack/react-start";
import { serverEnv } from "./.waypoint/env";

export const hasAdminSession = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const request = (context as { readonly request?: Request }).request;
  const cookie = request?.headers.get("cookie");
  if (!cookie) {
    return false;
  }

  const response = await fetch(`${serverEnv.PUBLIC_API_URL.href}/query/admin.summary`, {
    body: "{}",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    method: "POST",
  }).catch(() => null);

  return Boolean(response?.ok);
});

import { createServerFn } from "@tanstack/react-start";
import { rpcClient } from "./api";

export const hasAdminSession = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const request = (context as { readonly request?: Request }).request;
  if (!request) {
    return false;
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return false;
  }

  const session = await rpcClient.auth.session
    .call({}, { headers: request.headers })
    .catch(() => null);

  return session?.user?.role === "admin";
});

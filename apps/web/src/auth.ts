import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import { resolveApiUrl } from "./api";

const authClientOptions = {
  baseURL: `${resolveApiUrl()}/auth`,
  plugins: [anonymousClient()],
};

type GuestAuthClient = ReturnType<typeof createAuthClient<typeof authClientOptions>>;

export const authClient: GuestAuthClient = createAuthClient(authClientOptions);

export type AuthSession = typeof authClient.$Infer.Session;

export const ensureAnonymousSession = async () => {
  const session = await authClient.getSession();
  if (session.data) {
    return session.data;
  }

  const result = await authClient.signIn.anonymous();
  if (result.error) {
    throw new Error(result.error.message ?? "Could not create anonymous session.");
  }

  const created = await authClient.getSession();
  if (!created.data) {
    throw new Error("Anonymous session was created but could not be read.");
  }

  return created.data;
};

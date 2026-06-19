import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { clientEnv, serverEnv } from "./.pier/env";

type AuthClientOptions = {
  readonly baseURL: string;
  readonly fetchOptions: {
    readonly credentials: "include";
  };
  readonly plugins: [ReturnType<typeof adminClient>];
};

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL.href : clientEnv.PUBLIC_API_URL.href;

export const authClient: ReturnType<typeof createAuthClient<AuthClientOptions>> = createAuthClient({
  baseURL: `${apiUrl()}/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient()],
});

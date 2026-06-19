import { createAuthClient } from "better-auth/react";
import { clientEnv, serverEnv } from "./.pier/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: apiUrl().path("auth"),
  fetchOptions: {
    credentials: "include",
  },
});

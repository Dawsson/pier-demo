import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";
import { clientEnv, serverEnv } from "@/.pier/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const authClient = createAuthClient({
  baseURL: apiUrl().path("auth"),
  fetchOptions: {
    credentials: "include",
  },
  plugins: [anonymousClient()],
});

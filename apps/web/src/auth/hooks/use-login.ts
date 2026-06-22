import { useMutation } from "@tanstack/react-query";
import type { LoginValues } from "@/auth/schemas";
import { authClient } from "@/lib/auth";

export function useLogin() {
  return useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await authClient.signIn.email(values);

      if (result.error) {
        throw new Error(result.error.message ?? "Sign in failed.");
      }

      const session = await authClient.getSession();
      if (session.error || !session.data) {
        throw new Error(session.error?.message ?? "Sign in succeeded, but no session cookie was found.");
      }

      return result.data;
    },
    onSuccess: () => {
      window.location.replace("/");
    },
  });
}

import { useMutation } from "@tanstack/react-query";
import type { SignUpValues } from "@/auth/schemas";
import { authClient } from "@/lib/auth";

export function useRegisterUser() {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const fallbackName = values.email.split("@")[0]?.trim() || "New user";
      const result = await authClient.signUp.email({
        ...values,
        name: values.name?.trim() || fallbackName,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Account creation failed.");
      }

      const session = await authClient.getSession();
      if (session.error || !session.data) {
        throw new Error(
          session.error?.message ?? "Account created, but no session cookie was found.",
        );
      }

      return result.data;
    },
    onSuccess: () => {
      window.location.replace("/");
    },
  });
}

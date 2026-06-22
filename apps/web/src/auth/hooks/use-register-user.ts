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

      return result.data;
    },
    onSuccess: () => {
      window.location.replace("/");
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { SignUpValues } from "@/auth/schemas";
import { authClient } from "@/lib/auth";

export function useRegisterUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

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
      void router.navigate({ to: "/" }).then(() => router.invalidate());
      void queryClient.invalidateQueries();
    },
  });
}

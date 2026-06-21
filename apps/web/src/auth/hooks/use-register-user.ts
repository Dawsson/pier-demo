import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { SignUpValues } from "@/auth/schemas";
import { authClient } from "@/lib/auth";

export function useRegisterUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const result = await authClient.signUp.email(values);

      if (result.error) {
        throw new Error(result.error.message ?? "Account creation failed.");
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await router.invalidate();
    },
  });
}

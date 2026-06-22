import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { LoginValues } from "@/auth/schemas";
import { authClient } from "@/lib/auth";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await authClient.signIn.email(values);

      if (result.error) {
        throw new Error(result.error.message ?? "Sign in failed.");
      }

      return result.data;
    },
    onSuccess: () => {
      void router.navigate({ to: "/" }).then(() => router.invalidate());
      void queryClient.invalidateQueries();
    },
  });
}

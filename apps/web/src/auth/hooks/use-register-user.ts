import { useMutation } from "@tanstack/react-query";
import type { SignUpValues } from "@/auth/schemas";
import { registerServerFn } from "@/auth/server";

export function useRegisterUser() {
  return useMutation({
    mutationFn: (values: SignUpValues) => registerServerFn({ data: values }),
    onSuccess: () => {
      window.location.replace("/");
    },
  });
}

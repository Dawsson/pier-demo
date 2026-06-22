import { useMutation } from "@tanstack/react-query";
import type { LoginValues } from "@/auth/schemas";
import { loginServerFn } from "@/auth/server";

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginValues) => loginServerFn({ data: values }),
    onSuccess: () => {
      window.location.replace("/");
    },
  });
}

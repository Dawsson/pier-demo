import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginValues } from "@/auth/schemas";
import { useLogin } from "@/auth/hooks/use-login";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { OAuthButtons } from "@/routes/auth/-components/oauth-buttons";
import { AuthFormFrame } from "@/routes/auth/-components/auth-form-frame";

export function LoginForm({ className, ...props }: ComponentProps<"div">) {
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(loginSchema),
    shouldFocusError: true,
  });

  const onSubmit = (values: LoginValues) => {
    login.mutate(values, {
      onSuccess: async () => {
        await navigate({ to: "/app" });
      },
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <AuthFormFrame
          title="Welcome back"
          description="Sign in to continue."
          footer={
            <FieldDescription className="m-0 text-sm leading-normal !text-neutral-400 [&>a]:font-medium [&>a]:!text-neutral-50 [&>a]:no-underline hover:[&>a]:underline">
              New here? <Link to="/auth/sign-up">Create an account</Link>
            </FieldDescription>
          }
        >
          <OAuthButtons />
          <div className="flex items-center gap-3 text-[0.8125rem] text-neutral-500 leading-none before:h-px before:flex-1 before:bg-white/10 before:content-[''] after:h-px after:flex-1 after:bg-white/10 after:content-['']">
            <span>or continue with email</span>
          </div>

          <FieldGroup className="gap-[15px]">
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel className="font-medium text-sm !text-neutral-200" htmlFor="email">
                Email
              </FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  className="h-[42px] rounded-[10px] border-white/15 bg-white/[0.035] px-3 text-[0.9375rem] text-neutral-50 focus-visible:border-white/30 focus-visible:ring-white/10"
                  autoComplete="email"
                  type="email"
                  aria-invalid={!!form.formState.errors.email}
                  {...form.register("email")}
                />
                <FieldError
                  className="pt-1 font-medium text-red-300"
                  errors={[form.formState.errors.email]}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel className="font-medium text-sm !text-neutral-200" htmlFor="password">
                Password
              </FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  className="h-[42px] rounded-[10px] border-white/15 bg-white/[0.035] px-3 text-[0.9375rem] text-neutral-50 focus-visible:border-white/30 focus-visible:ring-white/10"
                  autoComplete="current-password"
                  type="password"
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <FieldError
                  className="pt-1 font-medium text-red-300"
                  errors={[form.formState.errors.password]}
                />
              </FieldContent>
            </Field>

            {login.isError ? (
              <FieldError className="font-semibold text-red-300">
                {login.error.message || "Sign in failed."}
              </FieldError>
            ) : null}
          </FieldGroup>

          <Button
            className="h-[42px] rounded-[10px] bg-neutral-50 font-semibold text-[0.9375rem] text-neutral-950 hover:bg-white"
            disabled={login.isPending}
            type="submit"
          >
            {login.isPending ? "Signing in" : "Continue"}
          </Button>
        </AuthFormFrame>
      </form>
    </div>
  );
}

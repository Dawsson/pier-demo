import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { authOAuthProviders } from "@/auth/auth-ui-config";
import { loginSchema, type LoginValues } from "@/auth/schemas";
import { useLogin } from "@/auth/hooks/use-login";
import { Button } from "@repo/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/utils";
import { OAuthButtons } from "@/routes/auth/-components/oauth-buttons";
import { AuthFormCard } from "@/routes/auth/-components/auth-form-card";

const inputClassName = "!h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem] leading-none";
const submitButtonClassName = "!h-[42px] rounded-[10px] font-semibold text-[0.9375rem]";
const hasOAuthProviders = authOAuthProviders.length > 0;

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
        await navigate({ to: "/" });
      },
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <AuthFormCard
          title="Welcome back"
          description="Sign in to continue."
          footer={
            <FieldDescription className="m-0 text-sm leading-normal">
              New here?{" "}
              <Link
                className="!font-normal !underline decoration-current underline-offset-3 [text-decoration-thickness:1px]"
                to="/auth/sign-up"
              >
                Create an account
              </Link>
            </FieldDescription>
          }
        >
          <OAuthButtons />
          {hasOAuthProviders ? (
            <div className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground leading-none before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
              <span>Email</span>
            </div>
          ) : null}

          <FieldGroup className="gap-[15px]">
            <Field invalid={!!form.formState.errors.email}>
              <FieldLabel className="font-normal text-foreground text-sm" htmlFor="email">
                Email
              </FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  className={inputClassName}
                  autoComplete="email"
                  placeholder="name@example.com"
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

            <Field invalid={!!form.formState.errors.password}>
              <FieldLabel className="font-normal text-foreground text-sm" htmlFor="password">
                Password
              </FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  className={inputClassName}
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

          <Button className={submitButtonClassName} disabled={login.isPending} type="submit">
            {login.isPending ? "Signing in" : "Continue"}
          </Button>
        </AuthFormCard>
      </form>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { authOAuthProviders, authUiConfig } from "@/auth/auth-ui-config";
import { signUpSchema, type SignUpValues } from "@/auth/schemas";
import { useRegisterUser } from "@/auth/hooks/use-register-user";
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

export function SignUpForm({ className, ...props }: ComponentProps<"div">) {
  const navigate = useNavigate();
  const registerUser = useRegisterUser();
  const form = useForm<SignUpValues>({
    defaultValues: {
      email: "",
      name: authUiConfig.signUp.requireName ? "" : undefined,
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(signUpSchema),
    shouldFocusError: true,
  });

  const onSubmit = (values: SignUpValues) => {
    registerUser.mutate(values, {
      onSuccess: async () => {
        await navigate({ to: "/" });
      },
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <AuthFormCard
          title="Create account"
          description="Create an account to continue."
          footer={
            <FieldDescription className="m-0 text-sm leading-normal">
              Have an account?{" "}
              <Link
                className="!font-normal !underline decoration-current underline-offset-3 [text-decoration-thickness:1px]"
                to="/auth/sign-in"
              >
                Sign in
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
            {authUiConfig.signUp.requireName ? (
              <Field invalid={!!form.formState.errors.name}>
                <FieldLabel className="font-normal text-foreground text-sm" htmlFor="name">
                  Name
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    className={inputClassName}
                    autoComplete="name"
                    placeholder="Jane Doe"
                    aria-invalid={!!form.formState.errors.name}
                    {...form.register("name")}
                  />
                  <FieldError
                    className="pt-1 font-medium text-red-300"
                    errors={[form.formState.errors.name]}
                  />
                </FieldContent>
              </Field>
            ) : null}

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
                  autoComplete="new-password"
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

            {registerUser.isError ? (
              <FieldError className="font-semibold text-red-300">
                {registerUser.error.message || "Account creation failed."}
              </FieldError>
            ) : null}
          </FieldGroup>

          <Button className={submitButtonClassName} disabled={registerUser.isPending} type="submit">
            {registerUser.isPending ? "Creating account" : "Continue"}
          </Button>
        </AuthFormCard>
      </form>
    </div>
  );
}

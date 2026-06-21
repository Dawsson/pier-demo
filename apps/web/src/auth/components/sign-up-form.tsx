import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpValues } from "@/auth/schemas";
import { useRegisterUser } from "@/auth/hooks/use-register-user";
import { OAuthButtons } from "@/auth/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SignUpForm({ className, ...props }: ComponentProps<"div">) {
  const navigate = useNavigate();
  const registerUser = useRegisterUser();
  const form = useForm<SignUpValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = (values: SignUpValues) => {
    registerUser.mutate(values, {
      onSuccess: async () => {
        await navigate({ to: "/app" });
      },
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="auth-form-card">
          <CardHeader className="auth-form-header">
            <div className="auth-form-brand">Pier Demo</div>
            <CardTitle className="auth-form-title">Create account</CardTitle>
            <CardDescription className="auth-form-description">
              Start with a simple demo account.
            </CardDescription>
          </CardHeader>

          <CardContent className="auth-form-content">
            <OAuthButtons />
            <div className="auth-divider">
              <span>or create one with email</span>
            </div>

            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    autoComplete="name"
                    aria-invalid={!!form.formState.errors.name}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    autoComplete="email"
                    type="email"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    autoComplete="new-password"
                    type="password"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </FieldContent>
              </Field>

              {registerUser.isError ? (
                <FieldError>{registerUser.error.message || "Account creation failed."}</FieldError>
              ) : null}
            </FieldGroup>

            <Button className="auth-submit-button" disabled={registerUser.isPending} type="submit">
              {registerUser.isPending ? "Creating account" : "Continue"}
            </Button>
          </CardContent>

          <div className="auth-card-footer">
            <FieldDescription className="m-0">
              Have an account? <Link to="/auth/sign-in">Sign in</Link>
            </FieldDescription>
          </div>
        </Card>
      </form>
    </div>
  );
}

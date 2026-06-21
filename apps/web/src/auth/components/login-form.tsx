import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginValues } from "@/auth/schemas";
import { useLogin } from "@/auth/hooks/use-login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function LoginForm({ className, ...props }: ComponentProps<"div">) {
  const navigate = useNavigate();
  const login = useLogin();
  const form = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
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
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="overflow-hidden p-0 shadow-none">
          <CardHeader className="p-6 pb-0 sm:p-7 sm:pb-0">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your account to add five at a time.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-7">
            <FieldGroup>
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
                    autoComplete="current-password"
                    type="password"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </FieldContent>
              </Field>

              {login.isError ? (
                <FieldError>{login.error.message || "Sign in failed."}</FieldError>
              ) : null}
            </FieldGroup>
          </CardContent>

          <CardFooter className="auth-card-footer">
            <FieldDescription className="m-0">
              No account? <Link to="/auth/sign-up">Create account</Link>
            </FieldDescription>
            <Button disabled={login.isPending} type="submit">
              {login.isPending ? "Signing in" : "Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

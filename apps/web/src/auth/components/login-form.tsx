import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginValues } from "@/auth/schemas";
import { useLogin } from "@/auth/hooks/use-login";
import { OAuthButtons } from "@/auth/components/oauth-buttons";
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
        <Card className="overflow-hidden rounded-2xl border bg-card !text-card-foreground shadow-[0_18px_42px_rgb(10_10_10_/_10%)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,var(--color-neutral-900),var(--color-neutral-950))] dark:shadow-[0_18px_42px_rgb(0_0_0_/_32%),inset_0_1px_0_rgb(255_255_255_/_6%)]">
          <CardHeader className="justify-items-center gap-1.5 px-7 pt-7 pb-5 text-center sm:px-7">
            <div className="font-semibold text-base text-foreground leading-tight">Pier Demo</div>
            <CardTitle className="font-bold text-2xl text-foreground leading-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-[0.9375rem] text-muted-foreground! leading-relaxed">
              Sign in to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-[18px] px-7 pb-7 sm:px-7">
            <OAuthButtons />
            <div className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground leading-none before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
              <span>or continue with email</span>
            </div>

            <FieldGroup className="gap-[15px]">
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel className="font-medium text-foreground text-sm" htmlFor="email">
                  Email
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    className="h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem] text-foreground dark:bg-white/[0.03]"
                    autoComplete="email"
                    type="email"
                    aria-invalid={!!form.formState.errors.email}
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </FieldContent>
              </Field>

              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel className="font-medium text-foreground text-sm" htmlFor="password">
                  Password
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    className="h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem] text-foreground dark:bg-white/[0.03]"
                    autoComplete="current-password"
                    type="password"
                    aria-invalid={!!form.formState.errors.password}
                    {...form.register("password")}
                  />
                  <FieldError errors={[form.formState.errors.password]} />
                </FieldContent>
              </Field>

              {login.isError ? (
                <FieldError className="font-semibold text-red-300">
                  {login.error.message || "Sign in failed."}
                </FieldError>
              ) : null}
            </FieldGroup>

            <Button
              className="h-[42px] rounded-[10px] bg-primary font-semibold text-[0.9375rem] text-primary-foreground hover:bg-primary/90"
              disabled={login.isPending}
              type="submit"
            >
              {login.isPending ? "Signing in" : "Continue"}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-center gap-1.5 rounded-none bg-muted/50 px-6 py-4">
            <FieldDescription className="m-0 text-sm leading-normal !text-muted-foreground [&>a]:font-medium [&>a]:!text-foreground [&>a]:no-underline hover:[&>a]:underline">
              New here? <Link to="/auth/sign-up">Create an account</Link>
            </FieldDescription>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

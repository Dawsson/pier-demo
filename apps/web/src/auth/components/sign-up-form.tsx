import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpValues } from "@/auth/schemas";
import { useRegisterUser } from "@/auth/hooks/use-register-user";
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
        <Card className="overflow-hidden p-0 shadow-none">
          <CardHeader className="p-6 pb-0 sm:p-7 sm:pb-0">
            <CardTitle>Create account</CardTitle>
            <CardDescription>Create an account to increment the shared counter.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-7">
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
          </CardContent>

          <CardFooter className="auth-card-footer">
            <FieldDescription className="m-0">
              Have an account? <Link to="/auth/sign-in">Sign in</Link>
            </FieldDescription>
            <Button disabled={registerUser.isPending} type="submit">
              {registerUser.isPending ? "Creating account" : "Create account"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpValues } from "@/auth/schemas";
import { useRegisterUser } from "@/auth/hooks/use-register-user";
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

export function SignUpForm({ className, ...props }: ComponentProps<"div">) {
  const navigate = useNavigate();
  const registerUser = useRegisterUser();
  const form = useForm<SignUpValues>({
    defaultValues: {
      email: "",
      name: "",
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
        await navigate({ to: "/app" });
      },
    });
  };

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <AuthFormFrame
          title="Create account"
          description="Start with a simple demo account."
          footer={
            <FieldDescription className="m-0 text-sm leading-normal [&>a]:font-medium [&>a]:no-underline hover:[&>a]:underline">
              Have an account? <Link to="/auth/sign-in">Sign in</Link>
            </FieldDescription>
          }
        >
          <OAuthButtons />
          <div className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground leading-none before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']">
            <span>or create one with email</span>
          </div>

          <FieldGroup className="gap-[15px]">
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel className="font-medium text-foreground text-sm" htmlFor="name">
                Name
              </FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  className="h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem]"
                  autoComplete="name"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                <FieldError
                  className="pt-1 font-medium text-red-300"
                  errors={[form.formState.errors.name]}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel className="font-medium text-foreground text-sm" htmlFor="email">
                Email
              </FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  className="h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem]"
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
              <FieldLabel className="font-medium text-foreground text-sm" htmlFor="password">
                Password
              </FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  className="h-[42px] rounded-[10px] bg-background px-3 text-[0.9375rem]"
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

          <Button
            className="h-[42px] rounded-[10px] font-semibold text-[0.9375rem]"
            disabled={registerUser.isPending}
            type="submit"
          >
            {registerUser.isPending ? "Creating account" : "Continue"}
          </Button>
        </AuthFormFrame>
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { FormEvent } from "react";

export function SignUpForm({
  className,
  email,
  error,
  isSubmitting = false,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  password,
  ...props
}: Omit<React.ComponentProps<"div">, "onSubmit"> & {
  readonly email: string;
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly onEmailChange: (value: string) => void;
  readonly onPasswordChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  readonly password: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-none">
        <CardContent className="p-0">
          <form className="p-6 sm:p-7" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold tracking-normal">Create account</h1>
                <p className="text-pretty text-muted-foreground text-sm">
                  Create an account to add five at a time.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  autoComplete="email"
                  value={email}
                  type="email"
                  onChange={(event) => onEmailChange(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  type="password"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button className="w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creating account" : "Create account"}
                </Button>
              </Field>
              {error ? <p className="text-destructive text-sm font-medium">{error}</p> : null}
              <FieldDescription className="text-center">
                Have an account? <Link to="/sign-in">Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

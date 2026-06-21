import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SignUpForm } from "@/components/sign-up-form";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const name = email.split("@")[0]?.trim() || email;
    const result = await authClient.signUp.email({ email, name, password });
    if (result.error) {
      setError(result.error.message ?? "Sign up failed.");
      return;
    }
    await navigate({ to: "/app" });
  };

  return (
    <SignUpForm
      className="auth-card"
      email={email}
      error={error}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={submit}
    />
  );
}

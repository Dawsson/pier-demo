import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Sign in failed.");
      return;
    }
    await navigate({ to: "/app" });
  };

  return (
    <LoginForm
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

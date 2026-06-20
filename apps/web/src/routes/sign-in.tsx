import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { LoginForm } from "../components/login-form";
import { authClient } from "../lib/auth";

export const Route = createFileRoute("/sign-in")({
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
    <main className="auth-page">
      <Link aria-label="Close sign in" className="close-link" to="/">
        <X aria-hidden size={32} strokeWidth={1.75} />
      </Link>
      <LoginForm
        className="auth-card"
        email={email}
        error={error}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={submit}
      />
    </main>
  );
}

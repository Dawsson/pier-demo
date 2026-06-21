import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/auth/components/login-form";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  return <LoginForm className="auth-card" />;
}

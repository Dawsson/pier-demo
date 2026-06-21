import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/auth/components/sign-up-form";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  return <SignUpForm className="auth-card" />;
}

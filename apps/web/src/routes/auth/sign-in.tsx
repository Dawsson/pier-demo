import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/routes/auth/-components/login-form";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  return <LoginForm className="w-full min-w-0 max-w-[calc(100vw-32px)] sm:max-w-[396px]" />;
}

import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/auth/components/sign-up-form";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  return <SignUpForm className="w-full min-w-0 max-w-[calc(100vw-32px)] sm:max-w-[396px]" />;
}

import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/routes/auth/-components/auth-layout";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

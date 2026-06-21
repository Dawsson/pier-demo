import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="auth-layout">
      <section className="auth-form-region">
        <Link aria-label="Close auth" className="close-link" to="/">
          <X aria-hidden size={22} strokeWidth={1.8} />
        </Link>
        <Outlet />
      </section>
    </main>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "../auth";

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
    await navigate({ search: {}, to: "/" });
  };

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Counter admin</p>
        <h1>Sign in</h1>
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input
              aria-label="Email"
              value={email}
              type="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              aria-label="Password"
              value={password}
              type="password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}

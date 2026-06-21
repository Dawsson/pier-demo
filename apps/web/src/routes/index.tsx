import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { rpcClient } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const counter = rpcClient.publicCounter.current.useQuery({
    retry: false,
  });
  const counterValue = counter.data?.value ?? 0;

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link to="/auth/sign-in">Sign in</Link>
        </nav>
      </header>

      <section className="counter-panel" aria-labelledby="counter-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">Starter app</p>
            <h1 id="counter-title">A simple shared counter.</h1>
          </div>
          <p className="summary">Sign in to increment it and make the template yours.</p>
        </div>

        <div className="counter-display" aria-live="polite">
          <span className="counter-value">{counterValue}</span>
          <span className="counter-caption">Current counter value</span>
        </div>

        <div className="actions primary-actions">
          <Button asChild size="lg">
            <Link to="/app">Increment counter</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

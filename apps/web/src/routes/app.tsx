import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { endpointClient, syncClient, syncConfig } from "@/lib/api";
import { authClient } from "@/lib/auth";
import { hasServerSessionCookie } from "@/lib/session";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (!(await hasServerSessionCookie())) {
      throw redirect({ to: "/auth/sign-in" });
    }
  },
  component: AppRoute,
});

function AppRoute() {
  const session = authClient.useSession();

  if (!session.data?.user) {
    return null;
  }

  return (
    <SyncProvider
      authEndpoint={endpointClient.sync.auth}
      client={syncClient}
      clientContext={contract.clientContext as never}
      config={syncConfig}
      schema={schema}
      user={session.data.user as never}
    >
      <AccountCounter />
    </SyncProvider>
  );
}

function AccountCounter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = syncClient.account.me.useQuery();

  const counter = syncClient.counter.current.useQuery();
  const increment = syncClient.counter.increment.useMutation();

  const counterValue = counter.data?.value ?? 0;

  const signOut = async () => {
    await authClient.signOut();
    await queryClient.invalidateQueries();
    await navigate({ to: "/" });
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <button className="link-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>

      <section className="counter-panel" aria-labelledby="counter-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">{me.data?.email ?? "Account"}</p>
            <h1 id="counter-title">Increment the counter.</h1>
          </div>
          <p className="summary">A tiny authenticated screen you can replace with your product.</p>
        </div>

        <div className="counter-display" aria-live="polite">
          <span className="counter-value">{counterValue}</span>
          <span className="counter-caption">Current value</span>
        </div>

        <div className="actions primary-actions">
          <Button
            disabled={increment.isPending}
            size="lg"
            type="button"
            onClick={() => increment.mutate({})}
          >
            {increment.isPending ? "Adding" : "Add 5"}
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/">View public page</Link>
          </Button>
        </div>

        {increment.error ? <p className="error">{String(increment.error)}</p> : null}
      </section>
    </main>
  );
}

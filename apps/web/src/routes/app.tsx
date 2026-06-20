import { SyncProvider } from "@pier/sync";
import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { contract } from "../../../api/src/contract";
import { schema } from "../../../api/src/sync-schema";
import { endpointClient, rpcClient, syncClient, syncConfig } from "../lib/api";
import { authClient } from "../lib/auth";
import { hasServerSessionCookie } from "../lib/session";

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
  const counter = rpcClient.counter.get.useQuery({ staleTime: 5_000 });
  const counterValue = counter.data?.value ?? 0;
  const me = syncClient.account.me.useQuery();
  const increment = rpcClient.counter.increment.useMutation({
    onSuccess: (nextCounter) =>
      queryClient.setQueryData(rpcClient.counter.get.queryKey(), nextCounter),
  });

  const signOut = async () => {
    await authClient.signOut();
    await queryClient.invalidateQueries();
    await navigate({ to: "/" });
  };

  return (
    <main className="shell">
      <section className="counter-panel" aria-labelledby="counter-title">
        <div className="counter-header">
          <div>
            <p className="section-label">{me.data?.email ?? "Account"}</p>
            <h1 id="counter-title">Count</h1>
          </div>
          <nav aria-label="Counter mode" className="mode-switch">
            <Link className="mode-option" to="/">
              Public
            </Link>
            <span aria-current="page" className="mode-option is-active">
              Account
            </span>
          </nav>
        </div>

        <div className="counter-display" aria-live="polite">
          <span className="counter-value">{counterValue}</span>
          <span className="counter-caption">Current value</span>
        </div>

        <div className="counter-meta">
          <span>Step</span>
          <strong>+5</strong>
        </div>

        <div className="actions primary-actions">
          <button
            className="primary-button"
            disabled={increment.isPending}
            type="button"
            onClick={() => increment.mutate({})}
          >
            {increment.isPending ? "Adding" : "Add 5"}
          </button>
          <button className="secondary-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>

        {increment.error ? <p className="error">{String(increment.error)}</p> : null}
      </section>
    </main>
  );
}

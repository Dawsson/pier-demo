import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { endpointClient, rpcClient } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const status = useQuery({
    queryFn: () => endpointClient.system.status.json(),
    queryKey: ["endpoint", endpointClient.system.status.href()],
  });
  const agentContext = rpcClient.agent.context.useQuery({ staleTime: 30_000 });

  return (
    <main className="shell">
      <section className="counter-panel" aria-labelledby="counter-title">
        <div className="counter-header">
          <div>
            <p className="section-label">API demo</p>
            <h1 id="counter-title">Pier Demo</h1>
          </div>
          <nav aria-label="Counter mode" className="mode-switch">
            <span aria-current="page" className="mode-option is-active">
              API
            </span>
            <Link className="mode-option" to="/app">
              Counter
            </Link>
          </nav>
        </div>

        <div className="counter-display" aria-live="polite">
          <span className="counter-value">{agentContext.data?.apps.length ?? 0}</span>
          <span className="counter-caption">Apps reported by RPC</span>
        </div>

        <div className="counter-meta">
          <span>Endpoint</span>
          <strong>{status.data?.ok ? "Healthy" : "Checking"}</strong>
        </div>
        <div className="counter-meta">
          <span>RPC</span>
          <strong>{agentContext.data?.project.template ?? "Loading"}</strong>
        </div>

        <div className="actions primary-actions">
          <Link className="primary-button" to="/app">
            Open counter
          </Link>
          <Link className="text-link" to="/auth/sign-in">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

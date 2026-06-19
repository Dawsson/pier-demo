import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { counterQueryOptions, endpointClient, rpcClient } from "../api";

export const Route = createFileRoute("/")({
  component: HomeRoute,
  loader: ({ context }) => context.queryClient.ensureQueryData(counterQueryOptions()),
});

function HomeRoute() {
  const initialCounter = Route.useLoaderData();
  const queryClient = useQueryClient();
  const counter = useQuery(counterQueryOptions());
  const counterValue = counter.data?.value ?? initialCounter.value;
  const status = useQuery({
    queryFn: () => endpointClient.system.status.json(),
    queryKey: ["endpoint", endpointClient.system.status.href()],
    staleTime: 30_000,
  });
  const increment = rpcClient.counter.increment.useMutation({
    onSuccess: (nextCounter) =>
      queryClient.setQueryData(rpcClient.counter.get.queryKey(), nextCounter),
  });

  return (
    <main className="shell">
      <section className="counter-panel" aria-labelledby="counter-title">
        <div className="counter-header">
          <div>
            <p className="section-label">Counter</p>
            <h1 id="counter-title">Count</h1>
          </div>
          <nav aria-label="Counter mode" className="mode-switch">
            <span aria-current="page" className="mode-option is-active">
              Public
            </span>
            <Link className="mode-option" to="/app">
              Account
            </Link>
          </nav>
        </div>

        <div className="counter-display" aria-live="polite">
          <span className="counter-value">{counterValue}</span>
          <span className="counter-caption">Current value</span>
        </div>

        <div className="counter-meta">
          <span>Step</span>
          <strong>+1</strong>
        </div>
        <div className="counter-meta">
          <span>Endpoint</span>
          <strong>{status.data?.ok ? "Healthy" : "Checking"}</strong>
        </div>

        <div className="actions primary-actions">
          <button
            className="primary-button"
            disabled={increment.isPending}
            type="button"
            onClick={() => increment.mutate({})}
          >
            {increment.isPending ? "Adding" : "Add 1"}
          </button>
          <Link className="text-link" to="/sign-in">
            Sign in
          </Link>
        </div>

        {increment.error ? <p className="error">{String(increment.error)}</p> : null}
      </section>
    </main>
  );
}

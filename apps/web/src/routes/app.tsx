import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { api, counterQueryOptions, meQueryOptions } from "../api";
import { authClient } from "../auth";
import { hasServerSession } from "../session";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (!(await hasServerSession())) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AppRoute,
  loader: async ({ context }) => {
    const [counter] = await Promise.all([
      context.queryClient.ensureQueryData(counterQueryOptions()),
      context.queryClient.ensureQueryData(meQueryOptions()),
    ]);
    return counter;
  },
});

function AppRoute() {
  const initialCounter = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const counter = useQuery(counterQueryOptions());
  const counterValue = counter.data?.value ?? initialCounter.value;
  const me = useQuery(meQueryOptions());
  const increment = useMutation({
    ...api.counter.increment.mutationOptions(),
    onSuccess: (nextCounter) => queryClient.setQueryData(api.counter.get.queryKey(), nextCounter),
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
            <p className="section-label">{me.data?.user?.email ?? "Account"}</p>
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
            onClick={() => increment.mutate()}
          >
            {increment.isPending ? "Adding" : "Add 5"}
          </button>
          <button className="secondary-button" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>

        {increment.error ? <p className="error">{increment.error.message}</p> : null}
      </section>
    </main>
  );
}

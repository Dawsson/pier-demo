import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminSummaryQueryOptions } from "../api";
import { hasAdminSession } from "../session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (!(await hasAdminSession())) {
      throw redirect({ search: {}, to: "/sign-in" });
    }
  },
  component: AdminHome,
  loader: ({ context }) => context.queryClient.ensureQueryData(adminSummaryQueryOptions()),
});

function AdminHome() {
  const summary = useQuery(adminSummaryQueryOptions());
  const data = summary.data;

  return (
    <main className="shell">
      <section className="panel wide">
        <p className="eyebrow">Counter admin</p>
        <h1>{data?.counter.value ?? 0}</h1>
        <p className="summary">Global counter value and recent increments.</p>

        <div className="stats-grid">
          <div>
            <span>Multiplier</span>
            <strong>{data?.counter.multiplier ?? 5}x</strong>
          </div>
          <div>
            <span>Recent increments</span>
            <strong>{data?.recentIncrements.length ?? 0}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Identity</th>
              <th>Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentIncrements ?? []).map((increment) => (
              <tr key={`${increment.createdAt}-${increment.identity}-${increment.counterValue}`}>
                <td>{new Date(increment.createdAt).toLocaleTimeString()}</td>
                <td>{increment.identity}</td>
                <td>{increment.amount}</td>
                <td>{increment.counterValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

import { createFileRoute, redirect } from "@tanstack/react-router";
import { rpcClient } from "../lib/api";
import { hasAdminSessionCookie } from "../lib/session";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (!(await hasAdminSessionCookie())) {
      throw redirect({ search: {}, to: "/auth/sign-in" });
    }
  },
  component: AdminHome,
});

function AdminHome() {
  const summary = rpcClient.admin.summary.useQuery({ staleTime: 5_000 });
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

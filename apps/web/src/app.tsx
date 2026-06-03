import { Link } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api, guestQueryOptions, meQueryOptions } from "./api";
import { authClient, ensureAnonymousSession, isAnonymousUser } from "./auth";

const queryClient = new QueryClient();

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function GuestHome() {
  return (
    <AppProviders>
      <GuestPanel />
    </AppProviders>
  );
}

export function WorkspaceHome() {
  return (
    <AppProviders>
      <WorkspacePanel />
    </AppProviders>
  );
}

function GuestPanel() {
  const session = authClient.useSession();
  const guestId = session.data?.user.id ?? "guest";
  const guest = useQuery(guestQueryOptions(guestId));
  const isAnonymous = isAnonymousUser(session.data?.user);

  const continueAsGuest = async () => {
    await ensureAnonymousSession();
    await queryClient.invalidateQueries({ queryKey: ["waypoint"] });
  };

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Waypoint example app</p>
          <h1>Anonymous auth, typed RPC, and Worker bindings in one small app.</h1>
          <p className="summary">
            This is a public example of the app shape Waypoint is aiming for: TanStack Start on the
            web, a Hono API Worker, Better Auth anonymous sessions, D1 through `ctx.db`, and an
            internal Worker reached through a service binding.
          </p>
          <div className="actions">
            <button className="primary" type="button" onClick={continueAsGuest}>
              Continue as guest
            </button>
            <Link className="secondary" to="/workspace">
              Open protected workspace
            </Link>
          </div>
        </div>

        <div className="status-board" aria-label="Waypoint runtime status">
          <StatusRow label="Auth mode" value={isAnonymous ? "anonymous" : "public"} />
          <StatusRow label="Guest user" value={guest.data?.internal.user.name ?? "loading"} />
          <StatusRow
            label="Worker RPC"
            value={guest.data ? `${guest.data.internal.sum}` : "loading"}
          />
          <StatusRow label="Typed client" value={`api.guest.queryOptions()`} />
        </div>
      </section>

      {guest.error ? <p className="error">{guest.error.message}</p> : null}
    </main>
  );
}

function WorkspacePanel() {
  const session = authClient.useSession();
  const me = useQuery({
    ...meQueryOptions(),
    enabled: Boolean(session.data),
  });

  return (
    <main className="shell workspace-shell">
      <section className="workspace">
        <div>
          <p className="eyebrow">Protected route</p>
          <h1>Guest workspace</h1>
          <p className="summary">
            TanStack Router created or reused an anonymous Better Auth session before this route
            rendered. The API then read the same cookie through the typed `api.me` query.
          </p>
        </div>

        <div className="workspace-grid">
          <StatusRow label="Session mode" value={me.data?.mode ?? "loading"} />
          <StatusRow label="User id" value={me.data?.user.id ?? "loading"} />
          <StatusRow label="Email" value={me.data?.user.email ?? "loading"} />
          <StatusRow label="Session id" value={me.data?.sessionId ?? "loading"} />
        </div>

        <div className="actions">
          <button
            className="secondary"
            type="button"
            onClick={async () => {
              await api.guest({ id: me.data?.user.id ?? "guest" });
              await queryClient.invalidateQueries({ queryKey: ["waypoint"] });
            }}
          >
            Test typed API call
          </button>
          <Link className="secondary" to="/">
            Back to public app
          </Link>
        </div>

        {me.error ? <p className="error">{me.error.message}</p> : null}
      </section>
    </main>
  );
}

function StatusRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="status-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

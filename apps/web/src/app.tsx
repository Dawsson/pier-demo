import { Link } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { meQueryOptions } from "./api";
import { authClient, ensureAnonymousSession, isAnonymousUser } from "./auth";

const queryClient = new QueryClient();

const signOut = async () => {
  await authClient.signOut();
  await queryClient.invalidateQueries({ queryKey: ["waypoint"] });
};

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
  const isAnonymous = isAnonymousUser(session.data?.user);
  const isLoggedIn = Boolean(session.data);

  const continueAsGuest = async () => {
    await ensureAnonymousSession();
    await queryClient.invalidateQueries({ queryKey: ["waypoint"] });
  };

  return (
    <main className="shell">
      <section className="hero-grid">
        <div className="console-panel primary-panel">
          <div className="panel-kicker">Waypoint demo surface</div>
          <h1>Deploy-ready Workers app with auth, bindings, and typed calls.</h1>
          <p className="lede">
            This guest app exercises the current platform path: TanStack Start, an API Worker,
            Better Auth guest sessions, D1, KV, service bindings, generated env types, and a
            browser-safe API contract.
          </p>

          <div className="actions">
            <button type="button" onClick={continueAsGuest}>
              Continue as guest
            </button>
            {isLoggedIn ? (
              <button type="button" className="secondary-action" onClick={signOut}>
                Sign out
              </button>
            ) : null}
            <Link to="/workspace">Open protected workspace</Link>
          </div>
        </div>

        <div className="console-panel">
          <div className="panel-title">
            <span>Runtime session</span>
            <span className={isLoggedIn ? "live-dot live" : "live-dot"} />
          </div>
          <dl className="status-list" aria-label="Auth status">
            <StatusRow label="Logged in" value={isLoggedIn ? "yes" : "no"} />
            <StatusRow
              label="Session type"
              value={isAnonymous ? "guest" : isLoggedIn ? "user" : "none"}
            />
            <StatusRow label="User id" value={session.data?.user.id ?? "none"} />
          </dl>
        </div>

        <SignalRail />
      </section>
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
    <main className="shell">
      <section className="workspace-layout">
        <div className="console-panel primary-panel">
          <div className="panel-kicker">Protected workspace</div>
          <h1>Server session confirmed through the typed API contract.</h1>
          <p className="lede">
            This page only renders useful data after the browser has a Better Auth session and the
            API Worker authorizes the `me` query.
          </p>
        </div>

        <div className="console-panel">
          <div className="panel-title">
            <span>Session envelope</span>
            <span className={me.data ? "live-dot live" : "live-dot"} />
          </div>
        <dl className="status-list" aria-label="Workspace session">
          <StatusRow label="Session mode" value={me.data?.mode ?? "loading"} />
          <StatusRow label="User id" value={me.data?.user.id ?? "loading"} />
          <StatusRow label="Email" value={me.data?.user.email ?? "loading"} />
          <StatusRow label="Session id" value={me.data?.sessionId ?? "loading"} />
        </dl>
        </div>

        <div className="actions">
          {session.data ? (
            <button type="button" className="secondary-action" onClick={signOut}>
              Sign out
            </button>
          ) : null}
          <Link to="/">Back to public app</Link>
        </div>

        {me.error ? <p className="error">{me.error.message}</p> : null}
      </section>
    </main>
  );
}

function SignalRail() {
  return (
    <div className="signal-rail" aria-label="Waypoint deployment capabilities">
      <Capability label="API Worker" value="typed contract" />
      <Capability label="Auth" value="Better Auth guest" />
      <Capability label="Bindings" value="KV + D1 + service" />
      <Capability label="Build" value="asset manifest" />
    </div>
  );
}

function Capability({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="capability">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

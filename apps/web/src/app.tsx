import { Link, useNavigate } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { meQueryOptions, streamAiGatewayExample, streamGuestEvents } from "./api";
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
  const navigate = useNavigate();
  const session = authClient.useSession();
  const isAnonymous = isAnonymousUser(session.data?.user);
  const isLoggedIn = Boolean(session.data);

  const continueAsGuest = async () => {
    await ensureAnonymousSession();
    await queryClient.invalidateQueries({ queryKey: ["waypoint"] });
    await navigate({ to: "/workspace" });
  };

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Waypoint guest app</p>
        <h1>Simple app, real platform wiring.</h1>
        <p className="summary">
          TanStack Start, an API Worker, Better Auth anonymous sessions, D1, KV, and a typed API
          contract.
        </p>

        <dl className="status-list" aria-label="Auth status">
          <StatusRow label="Logged in" value={isLoggedIn ? "yes" : "no"} />
          <StatusRow
            label="Session type"
            value={isAnonymous ? "guest" : isLoggedIn ? "user" : "none"}
          />
          <StatusRow label="User id" value={session.data?.user.id ?? "none"} />
        </dl>

        <div className="actions">
          <button type="button" onClick={continueAsGuest}>
            Continue as guest
          </button>
          {isLoggedIn ? (
            <button type="button" onClick={signOut}>
              Sign out
            </button>
          ) : null}
          <Link to="/workspace">Open protected workspace</Link>
        </div>
      </section>
    </main>
  );
}

function WorkspacePanel() {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [streamEvents, setStreamEvents] = useState<string[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const me = useQuery({
    ...meQueryOptions(),
    enabled: sessionChecked,
  });

  useEffect(() => {
    let active = true;
    authClient.getSession().then((session) => {
      if (!active) {
        return;
      }
      if (!session.data) {
        navigate({ replace: true, to: "/" });
        return;
      }
      setSessionChecked(true);
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Protected workspace</p>
        <h1>{sessionChecked ? "Signed in as guest." : "Checking session..."}</h1>

        <dl className="status-list" aria-label="Workspace session">
          <StatusRow
            label="Session mode"
            value={me.data?.mode ?? (sessionChecked ? "loading" : "checking")}
          />
          <StatusRow label="User id" value={me.data?.user.id ?? "none"} />
          <StatusRow label="Email" value={me.data?.user.email ?? "none"} />
          <StatusRow label="Session id" value={me.data?.sessionId ?? "none"} />
        </dl>

        <div className="actions">
          <button
            type="button"
            onClick={() => {
              setStreamEvents([]);
              setStreamError(null);
              streamGuestEvents((event) => setStreamEvents((events) => [...events, event])).catch(
                (error) =>
                  setStreamError(error instanceof Error ? error.message : "Stream failed."),
              );
            }}
          >
            Run stream demo
          </button>
          <button
            type="button"
            onClick={() => {
              setStreamEvents([]);
              setStreamError(null);
              streamAiGatewayExample((event) =>
                setStreamEvents((events) => [...events, event]),
              ).catch((error) =>
                setStreamError(
                  error instanceof Error ? error.message : "AI Gateway stream failed.",
                ),
              );
            }}
          >
            Run AI Gateway stream
          </button>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
          <Link to="/">Back to public app</Link>
        </div>

        {me.error ? <p className="error">{me.error.message}</p> : null}
        {streamError ? <p className="error">{streamError}</p> : null}
        {streamEvents.length ? (
          <pre className="stream-output">{streamEvents.join("\n")}</pre>
        ) : null}
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

import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLogout } from "@/auth/hooks/use-logout";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
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
  const navigate = useNavigate();

  const isAnonymous =
    typeof session.data?.user === "object" &&
    session.data.user !== null &&
    "isAnonymous" in session.data.user &&
    session.data.user.isAnonymous === true;

  useEffect(() => {
    if (!isAnonymous) return;
    void navigate({ replace: true, to: "/auth/sign-in" });
  }, [isAnonymous, navigate]);

  if (!session.data?.user || isAnonymous) {
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
  const logout = useLogout();

  const me = syncClient.account.me.useQuery();

  const counter = syncClient.counter.current.useQuery();
  const increment = syncClient.counter.increment.useMutation();

  const counterValue = counter.data?.value ?? 0;

  const signOut = async () => {
    logout.mutate(undefined, {
      onSuccess: async () => {
        await navigate({ to: "/" });
      },
    });
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <button
            className="link-button"
            disabled={logout.isPending}
            type="button"
            onClick={signOut}
          >
            {logout.isPending ? "Signing out" : "Sign out"}
          </button>
        </nav>
      </header>

      <Frame className="counter-frame" aria-labelledby="counter-title">
        <FrameHeader>
          <FrameTitle id="counter-title" className="counter-title">
            Increment the counter.
          </FrameTitle>
          <FrameDescription>
            A tiny authenticated screen you can replace with your product.
          </FrameDescription>
        </FrameHeader>

        <FramePanel>
          <div className="counter-display" aria-live="polite">
            <span className="section-label">{me.data?.email ?? "Account"}</span>
            <span className="counter-value">{counterValue}</span>
            <span className="counter-caption">Current value</span>
          </div>
          {increment.error ? <p className="error">{String(increment.error)}</p> : null}
        </FramePanel>

        <FrameFooter className="counter-footer">
          <Button
            disabled={increment.isPending}
            size="lg"
            type="button"
            onClick={() => increment.mutate({})}
          >
            {increment.isPending ? "Adding" : "Add 5"}
          </Button>
          <Button render={<Link to="/" />} size="lg" variant="ghost">
            View public page
          </Button>
        </FrameFooter>
      </Frame>
    </main>
  );
}

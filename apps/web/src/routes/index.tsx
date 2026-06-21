import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { toastManager } from "@/components/ui/toast";
import { rpcClient } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const navigate = useNavigate();
  const counter = rpcClient.publicCounter.current.useQuery({
    retry: false,
  });
  const counterValue = counter.data?.value ?? 0;
  const redirectToSignIn = async () => {
    toastManager.add({
      description: "Sign in first, then you can increment the shared counter.",
      id: "counter-login-required",
      title: "Login required",
      type: "info",
    });
    await navigate({ to: "/auth/sign-in" });
  };

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden />
          Pier Demo
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Button asChild size="sm" variant="ghost">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
        </nav>
      </header>

      <Frame className="counter-frame" aria-labelledby="counter-title">
        <FrameHeader>
          <FrameTitle id="counter-title" className="counter-title">
            A simple shared counter.
          </FrameTitle>
          <FrameDescription>Sign in to increment it and make the template yours.</FrameDescription>
        </FrameHeader>

        <FramePanel>
          <div className="counter-display" aria-live="polite">
            <span className="section-label">Starter app</span>
            <span className="counter-value">{counterValue}</span>
            <span className="counter-caption">Current counter value</span>
          </div>
        </FramePanel>

        <FrameFooter className="counter-footer">
          <Button size="lg" type="button" onClick={redirectToSignIn}>
            Increment counter
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
        </FrameFooter>
      </Frame>
    </main>
  );
}

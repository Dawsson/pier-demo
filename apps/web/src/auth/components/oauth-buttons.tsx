import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";

const showProviderToast = (provider: string) => {
  toastManager.add({
    description: `Add ${provider} credentials to enable this sign-in option.`,
    id: `oauth-${provider.toLowerCase()}-not-configured`,
    title: "OAuth not configured",
    type: "info",
  });
};

export function OAuthButtons() {
  return (
    <div className="auth-oauth-group">
      <Button
        className="auth-oauth-button"
        type="button"
        variant="outline"
        onClick={() => showProviderToast("GitHub")}
      >
        <span className="auth-provider-mark" aria-hidden>
          GH
        </span>
        Continue with GitHub
      </Button>
      <Button
        className="auth-oauth-button"
        type="button"
        variant="outline"
        onClick={() => showProviderToast("Microsoft")}
      >
        <span className="auth-provider-mark" aria-hidden>
          MS
        </span>
        Continue with Microsoft
      </Button>
    </div>
  );
}

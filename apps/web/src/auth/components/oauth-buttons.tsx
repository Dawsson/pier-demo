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
    <div className="grid min-w-0 gap-2.5">
      <Button
        className="h-[42px] min-w-0 justify-center bg-background text-foreground"
        type="button"
        variant="outline"
        onClick={() => showProviderToast("GitHub")}
      >
        <span
          className="inline-flex size-4 items-center justify-center rounded bg-foreground font-extrabold text-[0.55rem] text-background tracking-normal"
          aria-hidden
        >
          GH
        </span>
        Continue with GitHub
      </Button>
      <Button
        className="h-[42px] min-w-0 justify-center bg-background text-foreground"
        type="button"
        variant="outline"
        onClick={() => showProviderToast("Microsoft")}
      >
        <span
          className="inline-flex size-4 items-center justify-center rounded bg-foreground font-extrabold text-[0.55rem] text-background tracking-normal"
          aria-hidden
        >
          MS
        </span>
        Continue with Microsoft
      </Button>
    </div>
  );
}

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
        <GitHubLogo className="size-4" />
        Continue with GitHub
      </Button>
      <Button
        className="h-[42px] min-w-0 justify-center bg-background text-foreground"
        type="button"
        variant="outline"
        onClick={() => showProviderToast("Microsoft")}
      >
        <MicrosoftLogo className="size-4" />
        Continue with Microsoft
      </Button>
    </div>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.96c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.56 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#f25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7fba00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00a4ef" d="M3 12.5h8.5V21H3z" />
      <path fill="#ffb900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useContext, type CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { ThemeProviderContext } from "@/components/theme-provider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { isSystemDark, theme } = useContext(ThemeProviderContext);
  const resolvedTheme = theme === "system" ? (isSystemDark ? "dark" : "light") : theme;

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          description: "text-muted-foreground",
          toast:
            "border-border bg-popover text-popover-foreground shadow-sm [&_[data-icon]]:text-muted-foreground",
          title: "font-medium",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

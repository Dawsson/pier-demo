import { Monitor } from "lucide-react";
import { useContext } from "react";
import { ThemeProviderContext, type Theme } from "@/components/theme-provider";
import { Button } from "@repo/ui/button";

const nextTheme: Record<Theme, Theme> = {
  dark: "system",
  light: "dark",
  system: "light",
};

const themeLabel: Record<Theme, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
};

export function ThemeSwitcher() {
  const { setTheme, theme } = useContext(ThemeProviderContext);
  const next = nextTheme[theme];

  return (
    <Button
      aria-label={`Theme: ${themeLabel[theme]}. Switch to ${themeLabel[next]}.`}
      className="gap-1.5"
      size="sm"
      type="button"
      variant="ghost"
      onClick={() => setTheme(next)}
    >
      <Monitor aria-hidden />
      <span className="hidden sm:inline after:content-['Light'] dark:after:content-['Dark']" />
    </Button>
  );
}

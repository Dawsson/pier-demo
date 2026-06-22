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
  const { isSystemDark, setTheme, theme } = useContext(ThemeProviderContext);
  const resolvedTheme = theme === "system" ? (isSystemDark ? "dark" : "light") : theme;
  const next = nextTheme[theme];

  return (
    <Button
      aria-label={`Theme: ${themeLabel[resolvedTheme]}. Switch to ${themeLabel[next]}.`}
      className="gap-1.5"
      size="sm"
      type="button"
      variant="ghost"
      onClick={() => setTheme(next)}
    >
      <Monitor aria-hidden />
      <span className="hidden sm:inline">Theme</span>
    </Button>
  );
}

import { Monitor, Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { ThemeProviderContext, type Theme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

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
  const Icon = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
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
      <Icon aria-hidden />
      <span className="hidden sm:inline">{themeLabel[theme]}</span>
    </Button>
  );
}

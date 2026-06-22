import {
  createContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  isSystemDark: boolean;
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

export const DEFAULT_THEME: Theme = "system";
export const THEME_STORAGE_KEY = "pier-demo-theme";

const initialState: ThemeProviderState = {
  isSystemDark: false,
  setTheme: () => undefined,
  theme: DEFAULT_THEME,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const useThemeEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function getStoredTheme(storageKey: string, defaultTheme: Theme) {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  return (window.localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
}

function getSystemDark() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme(storageKey, defaultTheme));
  const [isSystemDark, setIsSystemDark] = useState(getSystemDark);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setIsSystemDark(mediaQuery.matches);

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useThemeEffect(() => {
    const root = window.document.documentElement;
    const resolvedTheme = theme === "system" ? (isSystemDark ? "dark" : "light") : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [isSystemDark, theme]);

  const value = useMemo<ThemeProviderState>(
    () => ({
      isSystemDark,
      setTheme: (nextTheme) => {
        window.localStorage.setItem(storageKey, nextTheme);
        setThemeState(nextTheme);
      },
      theme,
    }),
    [isSystemDark, storageKey, theme],
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

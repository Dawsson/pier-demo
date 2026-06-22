import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { RouterContext } from "@/router-context";
import "@/styles.css";

const themeScript = `
(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const defaultTheme = ${JSON.stringify(DEFAULT_THEME)};
  const root = document.documentElement;
  let theme = defaultTheme;

  try {
    theme = localStorage.getItem(storageKey) || defaultTheme;
  } catch {}

  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    theme = defaultTheme;
  }

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
})();
`;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { title: "Pier Counter" },
    ],
  }),
  notFoundComponent: NotFound,
});

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <RootDocument>
      <ThemeProvider>
        <QueryClientProvider client={context.queryClient}>
          <Outlet />
          <Toaster closeButton duration={1600} position="bottom-right" richColors={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="shell">
      <section className="auth-panel">
        <h1>Not found</h1>
        <p className="summary">That page is not available.</p>
      </section>
    </main>
  );
}

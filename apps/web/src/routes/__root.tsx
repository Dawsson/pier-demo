import { SyncProvider } from "@pier/sync";
import { contract } from "@pier-demo/api-contract";
import { schema } from "@pier-demo/api-contract/sync-schema";
import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import geistLatinFontUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import { useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  ThemeProvider,
  ThemeProviderContext,
} from "@/components/theme-provider";
import { Toaster } from "@repo/ui/sonner";
import { syncConfig, syncMutators } from "@/lib/api";
import { useCounterStore } from "@/lib/counter-store";
import { getSyncSessionServerFn } from "@/lib/sync-session";
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
  root.dataset.theme = theme;
  root.dataset.resolvedTheme = resolvedTheme;
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
  loader: () => getSyncSessionServerFn(),
  notFoundComponent: NotFound,
});

function RootComponent() {
  const context = Route.useRouteContext();

  return (
    <RootDocument>
      <ThemeProvider>
        <QueryClientProvider client={context.queryClient}>
          <RootSyncProvider>
            <Outlet />
          </RootSyncProvider>
          <AppToaster />
        </QueryClientProvider>
      </ThemeProvider>
    </RootDocument>
  );
}

function RootSyncProvider({ children }: Readonly<{ children: ReactNode }>) {
  const syncSession = Route.useLoaderData();
  const setSyncSession = useCounterStore((state) => state.setSyncSession);
  const userId = syncSession ? contract.clientContext.getUserID(syncSession.user as never) : null;
  const context = useMemo(
    () => (syncSession ? contract.clientContext.create(syncSession.user as never) : null),
    [syncSession],
  );

  useEffect(() => {
    setSyncSession(syncSession);
  }, [setSyncSession, syncSession]);

  if (!syncSession || !userId || !context) {
    return children;
  }

  return (
    <SyncProvider
      auth={syncSession.auth.token}
      cacheURL={syncConfig.cacheURL}
      context={context as never}
      mutateURL={syncConfig.mutateURL}
      mutators={syncMutators}
      queryURL={syncConfig.queryURL}
      schema={schema}
      storageKey={syncConfig.storageKey}
      userID={userId}
    >
      {children}
    </SyncProvider>
  );
}

function AppToaster() {
  const { isSystemDark, theme } = useContext(ThemeProviderContext);
  const resolvedTheme = theme === "system" ? (isSystemDark ? "dark" : "light") : theme;

  return (
    <Toaster
      closeButton
      duration={1600}
      position="bottom-right"
      richColors={false}
      theme={resolvedTheme}
    />
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link as="font" crossOrigin="anonymous" href={geistLatinFontUrl} rel="preload" />
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
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-7 text-foreground">
      <section className="grid w-full max-w-md gap-3 rounded-lg border bg-card p-7">
        <h1 className="font-semibold text-2xl leading-tight">Not found</h1>
        <p className="text-muted-foreground leading-relaxed">That page is not available.</p>
      </section>
    </main>
  );
}

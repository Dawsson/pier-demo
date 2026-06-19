import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { RouterContext } from "../router-context";
import "../styles.css";

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
      <QueryClientProvider client={context.queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
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

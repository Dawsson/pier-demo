import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createRouterContext } from "./router-context";
import { routeTree } from "./routeTree.gen";

export const getRouter = () =>
  createTanStackRouter({
    context: createRouterContext(),
    routeTree,
    scrollRestoration: true,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

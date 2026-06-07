import { QueryClient } from "@tanstack/react-query";

export const createRouterContext = () => ({
  queryClient: new QueryClient(),
});

export type RouterContext = ReturnType<typeof createRouterContext>;

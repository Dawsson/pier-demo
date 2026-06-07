import { createMiddleware, createStart } from "@tanstack/react-start";

const requestContext = createMiddleware({ type: "request" }).server(async ({ next, request }) =>
  next({
    context: {
      request,
    },
  }),
);

export const startInstance = createStart(() => ({
  requestMiddleware: [requestContext],
}));

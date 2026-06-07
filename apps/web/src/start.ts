import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

const requestContext = createMiddleware({ type: "request" }).server(async ({ next, request }) =>
  next({
    context: {
      request,
    },
  }),
);

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, requestContext],
}));

import { createMiddleware, createStart } from "@tanstack/react-start";
import { requireWorkspaceSession } from "./session-gate";

const workspaceSessionGate = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    const redirect = await requireWorkspaceSession(request);
    if (redirect) {
      return redirect;
    }

    return next({
      context: {
        request,
      },
    });
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [workspaceSessionGate],
}));

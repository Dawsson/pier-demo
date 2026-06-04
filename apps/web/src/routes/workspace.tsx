import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { WorkspaceHome } from "../app";
import { hasValidWorkspaceSession } from "../session-gate";

const requireServerWorkspaceSession = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const request = (context as { request?: Request }).request;
    if (!request || !(await hasValidWorkspaceSession(request))) {
      throw redirect({ to: "/" });
    }

    return true;
  },
);

export const Route = createFileRoute("/workspace")({
  beforeLoad: async () => {
    await requireServerWorkspaceSession();
  },
  component: WorkspaceHome,
});

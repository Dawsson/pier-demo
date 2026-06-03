import { createFileRoute, redirect } from "@tanstack/react-router";
import { WorkspaceHome } from "../app";
import { authClient, isAnonymousUser } from "../auth";

export const Route = createFileRoute("/workspace")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data || isAnonymousUser(session.data.user)) {
      throw redirect({ to: "/" });
    }
  },
  component: WorkspaceHome,
});

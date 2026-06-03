import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceHome } from "../app";
import { ensureAnonymousSession } from "../auth";

export const Route = createFileRoute("/workspace")({
  beforeLoad: async () => {
    if (typeof document === "undefined") {
      return;
    }

    await ensureAnonymousSession();
  },
  component: WorkspaceHome,
});

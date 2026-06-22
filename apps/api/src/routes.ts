import { os } from "./api";
import { adminRoutes } from "./modules/admin/api";
import { agentRoutes } from "./modules/agent/api";
import { counterRoutes } from "./modules/counter/api";
import { syncSessionRoutes } from "./modules/sync-session/api";
import { systemRoutes } from "./modules/system/api";

export const routes = os.router({
  admin: adminRoutes,
  agent: agentRoutes,
  publicCounter: counterRoutes,
  syncSession: syncSessionRoutes,
  system: systemRoutes,
});

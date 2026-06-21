import { os } from "./api";
import { adminRoutes } from "./modules/admin/api";
import { agentRoutes } from "./modules/agent/api";
import { systemRoutes } from "./modules/system/api";

export const routes = os.router({
  admin: adminRoutes,
  agent: agentRoutes,
  system: systemRoutes,
});

import { api } from "./procedures";
import { routes } from "./router";

export default api.worker(routes, {
  waypointAuth: ({ auth }) => auth,
});

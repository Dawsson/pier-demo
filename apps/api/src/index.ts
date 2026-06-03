import { api } from "./procedures";
import { contract } from "./router";

export default api.worker(contract, {
  authHandler: (ctx) => ctx.auth,
});

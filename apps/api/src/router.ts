import { healthEndpoint } from "./endpoints/health";
import { contract } from "./contract";
import { procedure } from "./procedures";
import { guestQuery } from "./queries/guest";
import { meQuery } from "./queries/me";

export const routes = procedure.router({
  guest: guestQuery,
  health: healthEndpoint,
  me: meQuery,
});

export { contract };

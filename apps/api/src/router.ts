import { healthEndpoint } from "./endpoints/health";
import { api } from "./procedures";
import { guestQuery } from "./queries/guest";
import { meQuery } from "./queries/me";

export const contract = api.router({
  guest: guestQuery,
  health: healthEndpoint,
  me: meQuery,
});

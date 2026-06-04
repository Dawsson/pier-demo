import { healthEndpoint } from "./endpoints/health";
import { guestStreamEndpoint } from "./endpoints/stream";
import { contract } from "./contract";
import { procedure } from "./procedures";
import { aiGatewayDescriptionQuery, aiGatewayForwardingEndpoint } from "./queries/ai-gateway";
import { guestQuery } from "./queries/guest";
import { meQuery } from "./queries/me";

export const routes = procedure.router({
  aiGatewayDescription: aiGatewayDescriptionQuery,
  aiGatewayForwarding: aiGatewayForwardingEndpoint,
  guest: guestQuery,
  health: healthEndpoint,
  me: meQuery,
  stream: guestStreamEndpoint,
});

export { contract };

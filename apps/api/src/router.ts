import { healthEndpoint } from "./endpoints/health";
import { contract } from "./contract";
import { counterIncrementMutation } from "./mutations/counter";
import { procedure } from "./procedures";
import { meQuery } from "./queries/account";
import { adminSummaryQuery } from "./queries/admin";
import { agentContextQuery } from "./queries/agent-context";
import { counterGetQuery } from "./queries/counter";

export const routes = procedure.router({
  account: {
    me: meQuery,
  },
  admin: {
    summary: adminSummaryQuery,
  },
  agent: {
    context: agentContextQuery,
  },
  counter: {
    get: counterGetQuery,
    increment: counterIncrementMutation,
  },
  health: healthEndpoint,
});

export { contract };

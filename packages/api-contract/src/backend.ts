import { contractBuilder as c } from "@pier/backend/contract";

import {
  adminSummaryOutputSchema,
  agentContextOutputSchema,
  emptyInputSchema,
  healthOutputSchema,
  incrementOutputSchema,
} from "./schemas";

export const contractModules = {
  admin: {
    summary: c.query().input(emptyInputSchema).output(adminSummaryOutputSchema),
  },
  agent: {
    context: c.query().input(emptyInputSchema).output(agentContextOutputSchema),
  },
  counter: {
    increment: c.mutation().input(emptyInputSchema).output(incrementOutputSchema),
  },
  system: {
    status: c
      .endpoint()
      .input(emptyInputSchema)
      .output(healthOutputSchema)
      .route({ method: "GET", path: "/status" }),
  },
};

export const backendContract = c.router(contractModules);

export type BackendContract = typeof backendContract;
export type ContractModules = typeof contractModules;

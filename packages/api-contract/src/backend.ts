import { contractBuilder as c } from "@pier/backend/contract";

import {
  adminSummaryOutputSchema,
  agentContextOutputSchema,
  counterOutputSchema,
  emptyInputSchema,
  healthOutputSchema,
  syncSessionOutputSchema,
} from "./schemas";

export const contractModules = {
  admin: {
    summary: c.query().input(emptyInputSchema).output(adminSummaryOutputSchema),
  },
  agent: {
    context: c.query().input(emptyInputSchema).output(agentContextOutputSchema),
  },
  publicCounter: {
    current: c.query().input(emptyInputSchema).output(counterOutputSchema),
  },
  syncSession: {
    current: c
      .endpoint()
      .input(emptyInputSchema)
      .output(syncSessionOutputSchema)
      .route({ method: "POST", path: "/sync/session" }),
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

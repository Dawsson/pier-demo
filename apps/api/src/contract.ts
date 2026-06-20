import { contractBuilder as c } from "@pier/backend/contract";
import { z } from "zod";

import { adminSummaryOutputSchema } from "#/modules/admin/api";
import { agentContextOutputSchema } from "#/modules/agent/api";
import { counterOutputSchema, incrementOutputSchema } from "#/modules/counter/api";
import { healthOutputSchema } from "#/modules/system/api";

const emptyInput = z.object({}).optional();

export const contractModules = {
  admin: {
    summary: c.query().input(emptyInput).output(adminSummaryOutputSchema),
  },
  agent: {
    context: c.query().input(emptyInput).output(agentContextOutputSchema),
  },
  counter: {
    get: c.query().input(emptyInput).output(counterOutputSchema),
    increment: c.mutation().input(emptyInput).output(incrementOutputSchema),
  },
  system: {
    status: c
      .endpoint()
      .input(emptyInput)
      .output(healthOutputSchema)
      .route({ method: "GET", path: "/status" }),
  },
};

export const backendContract = c.router(contractModules);

export type BackendContract = typeof backendContract;
export type ContractModules = typeof contractModules;

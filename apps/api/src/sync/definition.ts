import { initSync } from "@pier/sync/init";
import { z } from "zod";

import { schema } from "./schema";
import type { DemoSyncContext } from "./context";

export const createDemoSyncBuilder = () =>
  initSync<typeof schema>().context<DemoSyncContext>().create();

export type DemoSyncBuilder = ReturnType<typeof createDemoSyncBuilder>;

export const emptyInput = z.object({}).optional();

import { backendContract } from "@pier-demo/api-contract/backend";

import { createApi, type PierApiContext } from "./.pier/api";
import { createApiContext, type ApiContext as ApiServices } from "./context";

export const api = createApi().context<ApiServices>(({ env }) => createApiContext(env));

export type ApiContext = PierApiContext<ApiServices>;

export const os = api.implement(backendContract);

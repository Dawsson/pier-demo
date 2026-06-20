import { createApi } from "./.pier/api";
import { createApiContext, type ApiContext } from "./context";

export const api = createApi().context<ApiContext>(({ env }) => createApiContext(env));

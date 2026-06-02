import { apiContract, createApiWorker, endpoint, json, query } from "@waypoint/backend";
import type InternalWorker from "../../internal/src";
import appConfig from "../../../platform.config";
import { z } from "zod";

export interface ApiEnv {
  BETTER_AUTH_SECRET: string;
  INTERNAL: Service<typeof InternalWorker>;
  PUBLIC_APP_NAME: string;
}

const contract = apiContract<ApiEnv>({
  endpoints: {
    health: endpoint(appConfig.procedures?.public!)({
      method: "GET",
      path: "/health",
      run: ({ env }) =>
        json({
          app: env.PUBLIC_APP_NAME,
          ok: true,
          surface: "api",
        }),
    }),
  },
  queries: {
    guest: query(appConfig.procedures?.guest!)<ApiEnv, { id: string }>({
      input: z.object({
        id: z.string().default("guest"),
      }),
      run: async (ctx, input) => {
        const [user, sum] = await Promise.all([
          ctx.env.INTERNAL.getUser(input.id),
          ctx.env.INTERNAL.add(2, 3),
        ]);

        return {
          auth: "guest",
          internal: {
            sum,
            user,
          },
          message: "Guest access is enabled.",
          operation: ctx.operation.name,
        };
      },
    }),
  },
});

export default createApiWorker(contract);


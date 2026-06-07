import { createApiClient } from "@waypoint/backend";
import { contract } from "../../api/src/contract";
import { clientEnv, serverEnv } from "./.waypoint/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL.href : clientEnv.PUBLIC_API_URL.href;

export const createAdminApi = (fetcher?: typeof fetch) =>
  createApiClient<typeof contract>({
    baseUrl: apiUrl(),
    contract,
    ...(fetcher ? { fetch: fetcher } : {}),
  });

export const api = createAdminApi();

export const adminSummaryQueryOptions = () =>
  createAdminApi().admin.summary.queryOptions({ staleTime: 5_000 });

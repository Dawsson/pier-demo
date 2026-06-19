import { createApiClient } from "@pier/backend";
import { contract } from "../../api/src/contract";
import { clientEnv, serverEnv } from "./.pier/env";

const apiUrl = () =>
  typeof window === "undefined" ? serverEnv.PUBLIC_API_URL : clientEnv.PUBLIC_API_URL;

export const createAppApi = (fetcher?: typeof fetch) =>
  createApiClient<typeof contract>({
    baseUrl: apiUrl().href,
    contract,
    ...(fetcher ? { fetch: fetcher } : {}),
  });

export const api = createAppApi();

export const counterQueryOptions = () =>
  createAppApi().counter.get.queryOptions({ staleTime: 5_000 });

export const meQueryOptions = () => createAppApi().account.me.queryOptions({ staleTime: 15_000 });

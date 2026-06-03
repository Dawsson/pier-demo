import { createApiClient } from "@waypoint/backend";
import type { ApiContract } from "../../api/src/contract";

export const resolveApiUrl = () => {
  const apiUrl = import.meta.env.PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("Missing PUBLIC_API_URL for Waypoint API client.");
  }

  return apiUrl;
};

export const api = createApiClient<ApiContract>({
  baseUrl: resolveApiUrl(),
});

export const getGuest = async (id = "guest") => {
  return api.guest({ id });
};

export const guestQueryOptions = (id = "guest") => api.guest.queryOptions({ id });
export const meQueryOptions = () => api.me.queryOptions();

export type GuestQueryResult = Awaited<ReturnType<typeof getGuest>>;

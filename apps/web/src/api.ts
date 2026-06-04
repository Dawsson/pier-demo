import { createApiClient, readEventStream } from "@waypoint/backend";
import { contract } from "../../api/src/contract";
import { resolveApiUrl } from "./api-url";

export const api = createApiClient<typeof contract>({
  baseUrl: resolveApiUrl(),
  contract,
});

export const getGuest = async (id = "guest") => {
  return api.guest({ id });
};

export const guestQueryOptions = (id = "guest") => api.guest.queryOptions({ id });
export const meQueryOptions = () => api.me.queryOptions();

export const streamGuestEvents = async (onEvent: (event: string) => void) => {
  const response = await fetch(`${resolveApiUrl()}/events/guest`, {
    credentials: "include",
  });

  await readEventStream(response, {
    onEvent: (event) => onEvent(event.data),
  });
};

export const streamAiGatewayExample = async (onEvent: (event: string) => void) => {
  const response = await fetch(`${resolveApiUrl()}/events/ai-gateway`, {
    credentials: "include",
  });

  await readEventStream(response, {
    onEvent: (event) => onEvent(`${event.event ?? "message"}: ${event.data}`),
  });
};

export type GuestQueryResult = Awaited<ReturnType<typeof getGuest>>;

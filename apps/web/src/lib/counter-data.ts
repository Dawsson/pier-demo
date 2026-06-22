import { createServerFn } from "@tanstack/react-start";
import { rpcClient } from "@/lib/api";

export type PublicCounterInitialData = {
  readonly counter: Awaited<ReturnType<typeof rpcClient.publicCounter.current.call>>;
};

export const getPublicCounterServerFn = createServerFn({ method: "GET" }).handler(async () => {
  return {
    counter: await rpcClient.publicCounter.current.call({}),
  };
});

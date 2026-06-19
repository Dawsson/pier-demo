import { WorkerEntrypoint } from "cloudflare:workers";
import { json } from "@pier/backend";

export interface InternalEnv {
  CACHE: KVNamespace;
}

export default class InternalWorker extends WorkerEntrypoint<InternalEnv> {
  async add(a: number, b: number) {
    return a + b;
  }

  async getUser(id: string) {
    return {
      id,
      name: "Guest User",
    };
  }

  override async fetch() {
    return json({ error: "internal_worker_rpc_only" }, { status: 404 });
  }
}

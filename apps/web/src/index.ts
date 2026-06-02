import { newHttpBatchRpcSession } from "capnweb";

export interface GuestApi {
  query(name: "guest", input: { id?: string }): Promise<{
    auth: "guest";
    internal: {
      sum: number;
      user: {
        id: string;
        name: string;
      };
    };
    message: string;
    operation: string;
  }>;
}

export const createGuestApi = (apiUrl: string): GuestApi =>
  newHttpBatchRpcSession<GuestApi>(`${apiUrl}/rpc`) as GuestApi;

export const renderHome = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Waypoint Guest App</title>
  </head>
  <body>
    <main>
      <h1>Waypoint Guest App</h1>
      <p>This is a minimal public app surface for the Waypoint example.</p>
      <p>The public API exposes Cap'n Web RPC and calls the internal Worker through Worker RPC bindings.</p>
    </main>
  </body>
</html>`;


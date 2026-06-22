import { createSyncAuthTokenResult } from "@pier/sync";
import { os } from "#/api";

type AuthUser = {
  readonly id: string;
  readonly [key: string]: unknown;
};

export const syncSessionRoutes = {
  prepare: os.syncSession.prepare.endpoint({
    auth: "public",
    run: async ({ ctx, input }) => {
      const request = ctx.request;
      const headers = new Headers();
      const session = await ctx.auth.api.getSession({ headers: request.headers }).catch(() => null);
      let user: AuthUser | null = session?.user ?? null;

      if (!user && input.createAnonymous) {
        const anonymousResponse = await ctx.auth.handler(
          new Request(new URL("/auth/sign-in/anonymous", ctx.env.API_URL.href), {
            headers: request.headers,
            method: "POST",
          }),
        );

        copySetCookieHeaders(anonymousResponse.headers, headers);

        if (!anonymousResponse.ok) {
          return new Response(await anonymousResponse.text(), {
            headers,
            status: anonymousResponse.status,
          });
        }

        const anonymousBody = (await anonymousResponse.json().catch(() => null)) as {
          readonly user?: unknown;
        } | null;
        user = isAuthUser(anonymousBody?.user) ? anonymousBody.user : null;
      }

      if (!user) {
        return Response.json(
          {
            error: {
              message: "No active session.",
              status: 401,
            },
            ok: false,
          },
          { status: 401 },
        );
      }

      const auth = await createSyncAuthTokenResult(user.id, {
        secret: ctx.env.BETTER_AUTH_SECRET,
      });

      headers.set("content-type", "application/json");

      return Response.json(
        {
          auth,
          user,
        },
        { headers },
      );
    },
  }),
};

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { readonly id?: unknown }).id === "string"
  );
}

function copySetCookieHeaders(source: Headers, target: Headers) {
  const getSetCookie = (source as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === "function" ? getSetCookie.call(source) : [];

  if (cookies.length > 0) {
    for (const cookie of cookies) {
      target.append("set-cookie", cookie);
    }
    return;
  }

  const cookie = source.get("set-cookie");
  if (cookie) {
    target.append("set-cookie", cookie);
  }
}

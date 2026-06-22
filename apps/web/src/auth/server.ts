import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { serverEnv } from "@/.pier/env";
import { loginSchema, signUpSchema } from "@/auth/schemas";
import { httpErrorMessage } from "@/lib/http-error-message";

export const loginServerFn = createServerFn({ method: "POST" })
  .validator(loginSchema.parse)
  .handler(async ({ data }) => forwardAuthRequest(["sign-in", "email"], data));

export const registerServerFn = createServerFn({ method: "POST" })
  .validator(signUpSchema.parse)
  .handler(async ({ data }) => {
    const fallbackName = data.email.split("@")[0]?.trim() || "New user";

    return forwardAuthRequest(["sign-up", "email"], {
      ...data,
      name: data.name?.trim() || fallbackName,
    });
  });

async function forwardAuthRequest(path: readonly [string, string], body: unknown) {
  const response = await fetch(serverEnv.PUBLIC_API_URL.path("auth", ...path), {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      origin: serverEnv.PUBLIC_WEB_URL.href,
    },
    method: "POST",
  });
  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(httpErrorMessage(responseBody) ?? "Authentication failed.");
  }

  forwardSetCookie(response.headers);

  return { ok: true };
}

function forwardSetCookie(headers: Headers) {
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookieHeader(headers.get("set-cookie"));

  if (cookies.length > 0) {
    setResponseHeader("set-cookie", cookies);
  }
}

function splitSetCookieHeader(header: string | null) {
  return header?.split(/,(?=\s*[^;,]+?=)/).map((cookie) => cookie.trim()) ?? [];
}

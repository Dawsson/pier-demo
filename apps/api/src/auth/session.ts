import { PierApiError } from "@pier/backend";
import type { User } from "better-auth";
import type { UserWithRole } from "better-auth/plugins/admin";
import type { ApiContext } from "#/api";

export const currentSessionUser = async (ctx: ApiContext): Promise<User | null> => {
  const session = await ctx.auth.api.getSession({ headers: ctx.request.headers }).catch(() => null);
  return (session?.user ?? null) as User | null;
};

export const requireSessionUser = async (ctx: ApiContext): Promise<User> => {
  const user = await currentSessionUser(ctx);
  if (!user?.id) {
    throw new PierApiError("UNAUTHORIZED", {
      message: "Sign in to continue.",
      status: 401,
    });
  }
  return user;
};

export const roleForUser = (user: User) => {
  const role = userWithRole(user).role;
  return typeof role === "string" ? role : null;
};

const userWithRole = (user: User): UserWithRole => user as UserWithRole;

import {
  ANYONE_CAN,
  boolean,
  createBuilder,
  createSchema,
  definePermissions,
  number,
  string,
  table,
  type PermissionRule,
} from "@rocicorp/zero";

const syncServerSchema =
  databaseSearchPath(readEnv("DATABASE_URL")) ??
  readEnv("ZERO_SERVER_SCHEMA") ??
  readEnv("PUBLIC_ZERO_SERVER_SCHEMA");

const serverTable = (name: string) => (syncServerSchema ? `${syncServerSchema}.${name}` : name);

export const counterStateTable = table("counter_state")
  .from(serverTable("counter_state"))
  .columns({
    id: string(),
    updatedAt: string().from("updated_at"),
    value: number(),
  })
  .primaryKey("id");

export const userTable = table("user")
  .from(serverTable("user"))
  .columns({
    id: string(),
    name: string(),
    email: string(),
    emailVerified: boolean().from("email_verified"),
    isAnonymous: boolean().from("is_anonymous").optional(),
    image: string().optional(),
    role: string().optional(),
  })
  .primaryKey("id");

export const schema = createSchema({
  tables: [counterStateTable, userTable],
});

export const zql = createBuilder(schema);

type SyncAuthData = {
  readonly sub: string;
};

export const permissions = definePermissions<SyncAuthData, typeof schema>(schema, () => ({
  counter_state: {
    row: {
      select: ANYONE_CAN,
    },
  },
  user: {
    row: {
      select: [
        ((authData, { cmp }) => cmp("id", "=", authData.sub)) as PermissionRule<
          SyncAuthData,
          typeof schema,
          "user"
        >,
      ],
    },
  },
}));

type SyncEnvName = "DATABASE_URL" | "PUBLIC_ZERO_SERVER_SCHEMA" | "ZERO_SERVER_SCHEMA";

function readEnv(name: SyncEnvName) {
  const importMetaEnv = (
    import.meta as ImportMeta & {
      readonly env?: {
        readonly DATABASE_URL?: string;
        readonly PUBLIC_ZERO_SERVER_SCHEMA?: string;
        readonly ZERO_SERVER_SCHEMA?: string;
      };
    }
  ).env;
  const processEnv = (
    globalThis as { readonly process?: { readonly env?: Record<string, string> } }
  ).process?.env;

  switch (name) {
    case "DATABASE_URL":
      return (
        envValue(importMetaEnv?.DATABASE_URL, name) ?? envValue(processEnv?.DATABASE_URL, name)
      );
    case "PUBLIC_ZERO_SERVER_SCHEMA":
      return (
        envValue(importMetaEnv?.PUBLIC_ZERO_SERVER_SCHEMA, name) ??
        envValue(processEnv?.PUBLIC_ZERO_SERVER_SCHEMA, name)
      );
    case "ZERO_SERVER_SCHEMA":
      return (
        envValue(importMetaEnv?.ZERO_SERVER_SCHEMA, name) ??
        envValue(processEnv?.ZERO_SERVER_SCHEMA, name)
      );
  }
}

function envValue(value: string | undefined, name: SyncEnvName) {
  return value && value !== name ? value : undefined;
}

function databaseSearchPath(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const options = decodeURIComponent(
      databaseUrl.match(/[?&]options=([^&]+)/)?.[1]?.replaceAll("+", " ") ?? "",
    );
    return options?.match(/(?:^|\s)-csearch_path=([^\s,]+)/)?.[1];
  } catch {
    return undefined;
  }
}

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { prepareDatabase } from "./prepare-database";

type Command = "down" | "logs" | "reset" | "up";

const command = process.argv[2] as Command | undefined;

if (!command || !["down", "logs", "reset", "up"].includes(command)) {
  console.error("Usage: bun scripts/zero.ts <up|down|logs|reset>");
  process.exit(1);
}

if (command === "reset") {
  const baseEnv = zeroEnv();
  await run("docker", ["compose", "down", "-v"], dockerEnv(baseEnv));
  await decommissionZero(baseEnv);
  await prepareZeroDatabase(baseEnv);
  await deployPermissions(baseEnv);
  await run("docker", ["compose", "up", "-d", "zero-cache"], dockerEnv(baseEnv));
  await grantZeroMetadataAccess(baseEnv);
  process.exit(0);
}

const composeArgs =
  command === "up"
    ? ["compose", "up", "-d", "zero-cache"]
    : command === "down"
      ? ["compose", "down"]
      : ["compose", "logs", "-f", "zero-cache"];

if (command === "up") {
  const baseEnv = zeroEnv();
  await run("docker", ["compose", "down"], dockerEnv(baseEnv));
  await decommissionZero(baseEnv);
  await prepareZeroDatabase(baseEnv);
  await deployPermissions(baseEnv);
  await run("docker", composeArgs, dockerEnv(baseEnv));
  await grantZeroMetadataAccess(baseEnv);
  process.exit(0);
}

await run("docker", composeArgs, dockerEnv(zeroEnv()));

function zeroEnv() {
  const runtimeEnv = readApiRuntimeEnv();
  const provisionEnv = readProvisionEnv();
  const appDatabaseUrl = process.env.DATABASE_URL ?? runtimeEnv.DATABASE_URL;
  const serverSchema =
    process.env.ZERO_SERVER_SCHEMA ??
    process.env.PUBLIC_ZERO_SERVER_SCHEMA ??
    provisionEnv.DATABASE_SCHEMA ??
    databaseSearchPath(appDatabaseUrl);
  const zeroDatabaseUrl = withSearchPath(
    process.env.ZERO_DATABASE_URL ?? provisionEnv.ZERO_DATABASE_URL ?? appDatabaseUrl,
    serverSchema,
  );

  return {
    ...process.env,
    ...runtimeEnv,
    DATABASE_URL: appDatabaseUrl,
    DEV_ZERO_PORT: process.env.DEV_ZERO_PORT ?? "4859",
    ZERO_APP_ID: process.env.ZERO_APP_ID ?? "pier_demo_local",
    ZERO_AUTH_SECRET: process.env.ZERO_AUTH_SECRET ?? runtimeEnv.ZERO_AUTH_SECRET ?? "unused",
    ZERO_CHANGE_DB: process.env.ZERO_CHANGE_DB ?? zeroDatabaseUrl,
    ZERO_CVR_DB: process.env.ZERO_CVR_DB ?? zeroDatabaseUrl,
    ZERO_SERVER_SCHEMA: serverSchema,
    ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB ?? zeroDatabaseUrl,
    ...(serverSchema ? { PUBLIC_ZERO_SERVER_SCHEMA: serverSchema } : {}),
  };
}

function dockerEnv(env: NodeJS.ProcessEnv) {
  return { ...env };
}

function readApiRuntimeEnv() {
  const configPath = ".pier/build/dev/api/api.json";
  const runtimePath = ".pier/build/dev/api/runtime.json";

  if (!(existsSync(configPath) && existsSync(runtimePath))) {
    console.error(
      "Missing generated API runtime files. Run `dev restart api` before starting Zero.",
    );
    process.exit(1);
  }

  const apiConfig = JSON.parse(readFileSync(configPath, "utf8")) as {
    readonly vars?: Record<string, unknown>;
  };
  const apiRuntime = JSON.parse(readFileSync(runtimePath, "utf8")) as {
    readonly port?: unknown;
  };
  const betterAuthSecret = apiConfig.vars?.BETTER_AUTH_SECRET;
  const databaseUrl = apiConfig.vars?.DATABASE_URL;
  const apiPort =
    typeof apiRuntime.port === "number"
      ? String(apiRuntime.port)
      : typeof apiRuntime.port === "string"
        ? apiRuntime.port
        : undefined;

  if (typeof betterAuthSecret !== "string" || betterAuthSecret.length === 0) {
    console.error(
      "Missing generated BETTER_AUTH_SECRET. Run `dev restart api` before starting Zero.",
    );
    process.exit(1);
  }

  if (typeof databaseUrl !== "string" || databaseUrl.length === 0) {
    console.error("Missing generated DATABASE_URL. Run `dev restart api` before starting Zero.");
    process.exit(1);
  }

  return {
    ...(apiPort ? { DEV_API_PORT: apiPort } : {}),
    DATABASE_URL: databaseUrl,
    ZERO_AUTH_SECRET: betterAuthSecret,
  };
}

function readProvisionEnv() {
  const path = ".pier/db-provision/pier_demo-dev.env";
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function databaseSearchPath(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const options = new URL(databaseUrl).searchParams.get("options");
    return options?.match(/(?:^|\s)-csearch_path=([^\s,]+)/)?.[1];
  } catch {
    return undefined;
  }
}

function withSearchPath(databaseUrl: string, schemaName: string | undefined) {
  if (!schemaName) {
    return databaseUrl;
  }

  const url = new URL(databaseUrl);
  url.searchParams.set("options", `-csearch_path=${schemaName}`);
  return url.toString();
}

async function deployPermissions(env: NodeJS.ProcessEnv) {
  await run(
    "node",
    [
      "node_modules/@rocicorp/zero/out/zero/src/deploy-permissions.js",
      "--schema-path",
      "packages/api-contract/src/sync-schema.ts",
      "--app-id",
      env.ZERO_APP_ID ?? "pier_demo_local",
      "--upstream-db",
      env.ZERO_UPSTREAM_DB ?? env.DATABASE_URL ?? "",
    ],
    env,
  );
}

async function prepareZeroDatabase(env: NodeJS.ProcessEnv) {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Run `dev restart api` before starting Zero.");
  }

  await prepareDatabase(env.DATABASE_URL);
}

async function decommissionZero(env: NodeJS.ProcessEnv) {
  await run("node", ["node_modules/@rocicorp/zero/out/zero/src/zero-out.js"], env);
}

async function grantZeroMetadataAccess(env: NodeJS.ProcessEnv) {
  const adminUrl = env.ZERO_DATABASE_URL ?? env.ZERO_UPSTREAM_DB;
  const appUrl = env.DATABASE_URL;
  const appId = env.ZERO_APP_ID ?? "pier_demo_local";

  if (!adminUrl || !appUrl) {
    return;
  }

  const appRole = new URL(appUrl).username.split(".")[0];
  const schemas = [appId, `${appId}_0`, `${appId}_0/cdc`, `${appId}_0/cvr`];
  const sql = postgres(adminUrl, { max: 1, onnotice: () => undefined });

  try {
    await waitForZeroMetadataSchemas(sql, schemas);

    for (const schema of schemas) {
      await sql.unsafe(
        `grant usage on schema ${quoteIdentifier(schema)} to ${quoteIdentifier(appRole)}`,
      );
      await sql.unsafe(
        `grant select, insert, update, delete on all tables in schema ${quoteIdentifier(schema)} to ${quoteIdentifier(appRole)}`,
      );
      await sql.unsafe(
        `grant usage, select, update on all sequences in schema ${quoteIdentifier(schema)} to ${quoteIdentifier(appRole)}`,
      );
    }
  } finally {
    await sql.end();
  }
}

async function waitForZeroMetadataSchemas(
  sql: ReturnType<typeof postgres>,
  schemas: readonly string[],
) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    const rows = await sql<{ schemaName: string }[]>`
      select schema_name as "schemaName"
      from information_schema.schemata
      where schema_name in ${sql(schemas)}
    `;
    const found = new Set(rows.map((row) => row.schemaName));

    if (schemas.every((schema) => found.has(schema))) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Zero metadata schemas: ${schemas.join(", ")}`);
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function run(cmd: string, args: readonly string[], env: NodeJS.ProcessEnv) {
  const child = spawn(cmd, [...args], {
    env,
    stdio: "inherit",
  });

  const code = await new Promise<number | null>((resolve) => {
    child.on("exit", resolve);
  });

  if (code !== 0) {
    process.exit(code ?? 1);
  }
}

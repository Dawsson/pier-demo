import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const hostDatabaseUrl = "postgresql://postgres:pass@127.0.0.1:55432/zero";
const dockerDatabaseUrl = "postgres://postgres:pass@upstream-db:5432/zero";

type Command = "down" | "logs" | "permissions" | "reset" | "up";

const command = process.argv[2] as Command | undefined;

if (!command || !["down", "logs", "permissions", "reset", "up"].includes(command)) {
  console.error("Usage: bun scripts/zero.ts <up|down|logs|permissions|reset>");
  process.exit(1);
}

if (command === "permissions") {
  const baseEnv = zeroEnv({ requireApiRuntime: false });
  await run("docker", ["compose", "up", "-d", "--wait", "upstream-db"], dockerEnv(baseEnv));
  await run("bun", ["scripts/bootstrap-db.ts"], baseEnv);
  await deployPermissions(baseEnv);
  process.exit(0);
}

if (command === "reset") {
  const baseEnv = zeroEnv({ requireApiRuntime: false });
  await run("docker", ["compose", "down", "-v"], dockerEnv(baseEnv));
  await run("docker", ["compose", "up", "-d", "--wait", "upstream-db"], dockerEnv(baseEnv));
  await run("bun", ["scripts/bootstrap-db.ts"], baseEnv);
  await run("node", ["node_modules/@rocicorp/zero/out/zero/src/zero-out.js"], baseEnv);
  await deployPermissions(baseEnv);
  await run(
    "docker",
    ["compose", "up", "-d", "zero-cache"],
    dockerEnv(zeroEnv({ requireApiRuntime: true })),
  );
  process.exit(0);
}

const composeArgs =
  command === "up"
    ? ["compose", "up", "-d", "upstream-db", "zero-cache"]
    : command === "down"
      ? ["compose", "down"]
      : ["compose", "logs", "-f", "zero-cache"];

if (command === "up") {
  const baseEnv = zeroEnv({ requireApiRuntime: false });
  await run("docker", ["compose", "up", "-d", "--wait", "upstream-db"], dockerEnv(baseEnv));
  await run("bun", ["scripts/bootstrap-db.ts"], baseEnv);
  await deployPermissions(baseEnv);
}

await run("docker", composeArgs, dockerEnv(zeroEnv({ requireApiRuntime: command !== "down" })));

function zeroEnv({ requireApiRuntime }: { readonly requireApiRuntime: boolean }) {
  const runtimeEnv = requireApiRuntime ? readApiRuntimeEnv() : {};
  const databaseUrl = process.env.DATABASE_URL ?? hostDatabaseUrl;

  return {
    ...process.env,
    ...runtimeEnv,
    DATABASE_URL: databaseUrl,
    DEV_ZERO_PORT: process.env.DEV_ZERO_PORT ?? "4859",
    ZERO_APP_ID: process.env.ZERO_APP_ID ?? "pier_demo_local",
    ZERO_AUTH_SECRET: process.env.ZERO_AUTH_SECRET ?? runtimeEnv.ZERO_AUTH_SECRET ?? "unused",
    ZERO_CHANGE_DB: process.env.ZERO_CHANGE_DB ?? hostDatabaseUrl,
    ZERO_CVR_DB: process.env.ZERO_CVR_DB ?? hostDatabaseUrl,
    ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB ?? hostDatabaseUrl,
  };
}

function dockerEnv(env: NodeJS.ProcessEnv) {
  return {
    ...env,
    ZERO_CHANGE_DB: dockerDatabaseUrl,
    ZERO_CVR_DB: dockerDatabaseUrl,
    ZERO_UPSTREAM_DB: dockerDatabaseUrl,
  };
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

  return {
    ...(apiPort ? { DEV_API_PORT: apiPort } : {}),
    ZERO_AUTH_SECRET: betterAuthSecret,
  };
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
      env.DATABASE_URL ?? "",
    ],
    env,
  );
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

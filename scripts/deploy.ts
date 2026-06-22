const args = ["deploy", "all", "--env", process.env.PIER_ENV ?? "prod"];

if (process.env.PIER_ZERO_CACHE_URL) {
  args.push("--zero-url", process.env.PIER_ZERO_CACHE_URL);
}

const child = Bun.spawn(["pier", ...args], {
  stderr: "inherit",
  stdout: "inherit",
});

const code = await child.exited;
if (code !== 0) {
  globalThis.process.exit(code);
}

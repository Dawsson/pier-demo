import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const maxArgIndex = process.argv.indexOf("--max");
const maxLines =
  maxArgIndex >= 0 && process.argv[maxArgIndex + 1]
    ? Number.parseInt(process.argv[maxArgIndex + 1], 10)
    : 300;

const ignoredDirs = new Set([".git", ".pier", "dist", "node_modules"]);

const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);

const ignoredPathParts = [
  ["src", ".pier"],
  ["packages", "ui", "src", "components", "ui"],
];

const ignoredFiles = [/routeTree\.gen\.ts$/, /\.generated\.ts$/];
const oversizedFiles: Array<{ readonly lines: number; readonly path: string }> = [];

walk(".");

if (oversizedFiles.length > 0) {
  console.error(`Files must stay at or below ${maxLines} lines:`);
  for (const file of oversizedFiles.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${file.lines.toString().padStart(4)} ${file.path}`);
  }
  process.exit(1);
}

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) {
      continue;
    }

    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      walk(path);
      continue;
    }

    if (!stats.isFile() || shouldIgnoreFile(path) || !isSourceFile(path)) {
      continue;
    }

    const lines = countLines(path);
    if (lines > maxLines) {
      oversizedFiles.push({ lines, path: relative(".", path) });
    }
  }
}

function shouldIgnoreFile(path: string) {
  const normalizedParts = path.split(sep);

  if (ignoredFiles.some((pattern) => pattern.test(path))) {
    return true;
  }

  return ignoredPathParts.some((ignoredParts) =>
    containsPathSequence(normalizedParts, ignoredParts),
  );
}

function isSourceFile(path: string) {
  return sourceExtensions.has(path.slice(path.lastIndexOf(".")));
}

function countLines(path: string) {
  const content = readFileSync(path, "utf8");
  if (content.length === 0) {
    return 0;
  }

  return content.endsWith("\n") ? content.split("\n").length - 1 : content.split("\n").length;
}

function containsPathSequence(parts: readonly string[], sequence: readonly string[]) {
  return parts.some((_, startIndex) =>
    sequence.every((part, sequenceIndex) => parts[startIndex + sequenceIndex] === part),
  );
}

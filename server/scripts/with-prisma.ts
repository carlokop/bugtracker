import { spawnSync } from "node:child_process";
import { configureDatabaseEnv, isMariaDbDatabase } from "../src/lib/database-env.js";

configureDatabaseEnv();

function run(command: string, args: string[]): number {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  return result.status ?? 1;
}

function prismaSchema(): string {
  return isMariaDbDatabase()
    ? "prisma/mysql/schema.prisma"
    : "prisma/schema.prisma";
}

const userArgs = process.argv.slice(2);
const subcommand = userArgs[0];

if (subcommand === "migrate" && userArgs[1] === "deploy") {
  const code = run("npx", ["tsx", "scripts/generate-prisma.ts"]);
  if (code !== 0) process.exit(code);

  const result = spawnSync(
    "npx",
    ["prisma", "migrate", "deploy", "--schema", prismaSchema()],
    { stdio: "inherit", env: process.env, shell: true },
  );
  process.exit(result.status ?? 1);
}

if (subcommand === "db" && userArgs[1] === "seed") {
  const code = run("npx", ["tsx", "scripts/generate-prisma.ts"]);
  if (code !== 0) process.exit(code);
}

const result = spawnSync("npx", ["prisma", ...userArgs], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);

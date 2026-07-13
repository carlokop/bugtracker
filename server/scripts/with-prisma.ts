import { spawnSync } from "node:child_process";
import { configureDatabaseEnv } from "../src/lib/database-env.js";

configureDatabaseEnv();

const args = process.argv.slice(2);
const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);

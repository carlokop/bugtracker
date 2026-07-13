import { spawnSync } from "node:child_process";
import {
  configureDatabaseEnv,
  isMariaDbDatabase,
} from "../src/lib/database-env.js";

configureDatabaseEnv();

const schema = isMariaDbDatabase()
  ? "prisma/mysql/schema.prisma"
  : "prisma/schema.prisma";

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);

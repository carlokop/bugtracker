import { spawnSync } from "node:child_process";
import {
  configureDatabaseEnv,
  isPostgresDatabase,
} from "../src/lib/database-env.js";

configureDatabaseEnv();

const schema = isPostgresDatabase()
  ? "prisma/postgresql/schema.prisma"
  : "prisma/schema.prisma";

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the `server/` directory (works when cwd is project root on Plesk). */
export const SERVER_ROOT = path.resolve(currentDir, "..");

/** Absolute path to the project root (parent of `server/`). */
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, "..");

export function loadEnvFiles(): void {
  dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });
  dotenv.config({ path: path.join(SERVER_ROOT, ".env") });
}

loadEnvFiles();

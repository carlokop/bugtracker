import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(serverRoot, ".env");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");

if (!existsSync(path.join(distDir, "index.html"))) {
  console.error("Geen dist/index.html gevonden. Draai eerst npm run build.");
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });

for (const entry of ["assets", "index.html"]) {
  const source = path.join(distDir, entry);
  const target = path.join(publicDir, entry);
  if (!existsSync(source)) continue;

  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

console.log("Frontend gekopieerd naar public/ (Plesk document root).");

/**
 * Draai op de server om opstartproblemen te diagnosticeren:
 *   node server/check-startup.mjs
 */
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverRoot = path.join(root, "server");
const checks = [
  ["server/.env", path.join(serverRoot, ".env")],
  ["server/dist/index.js", path.join(serverRoot, "dist", "index.js")],
  ["public/index.html", path.join(root, "public", "index.html")],
  ["server/node_modules/express", path.join(serverRoot, "node_modules", "express")],
  ["server/node_modules/bcryptjs", path.join(serverRoot, "node_modules", "bcryptjs")],
];

console.log("Bugtracker startup check\n");

let ok = true;
for (const [label, filePath] of checks) {
  const exists = existsSync(filePath);
  console.log(`${exists ? "OK" : "MISSING"}  ${label}`);
  if (!exists) ok = false;
}

if (!ok) {
  console.log("\nLos ontbrekende bestanden op en draai: npm run deploy");
  process.exit(1);
}

try {
  process.env.PASSENGER_APP_ENV ??= "1";
  await import("./env-bootstrap.js");
  const { default: app } = await import("./dist/index.js");
  console.log("\nOK  server/dist/index.js laadt zonder crash");
  console.log(`OK  express app export (${typeof app})`);
} catch (error) {
  console.error("\nFAIL  server/dist/index.js crasht bij laden:");
  console.error(error);
  process.exit(1);
}

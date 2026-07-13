import "./lib/paths.js";
import "./lib/database-env.js";
import express from "express";
import { configureApp } from "./configure-app.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const isPassenger = Boolean(process.env.PASSENGER_APP_ENV);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

try {
  configureApp(app);
  console.log("Bugtracker app configured");
} catch (error) {
  console.error("Bugtracker startup mislukt:", error);
}

if (!isPassenger) {
  app.listen(port, () => {
    console.log(`Bugtracker API listening on http://localhost:${port}`);
  });
}

export default app;

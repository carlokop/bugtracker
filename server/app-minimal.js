/**
 * Minimale test-app voor Plesk-diagnose.
 * Zet tijdelijk Application Startup File op: server/app-minimal.js
 */
import express from "express";

const app = express();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: "minimal" });
});

app.get("*", (_req, res) => {
  res.status(200).send("Bugtracker minimal test OK");
});

export default app;

import "./lib/database-env.js";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import feedbackRoutes from "./routes/feedback.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/uploads.js";
import proxyRoutes from "./routes/proxy.js";
import screenshotRoutes from "./routes/screenshots.js";
import { isAppError } from "./lib/errors.js";
import { SERVER_ROOT } from "./lib/paths.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
const isPassenger = Boolean(process.env.PASSENGER_APP_ENV);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required (server/.env of Plesk env vars)");
}

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use((_req, res, next) => {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
  next();
});
app.use("/uploads", express.static(path.join(SERVER_ROOT, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/screenshots", screenshotRoutes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (isAppError(err)) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    console.error(err);
    res.status(500).json({ error: "Interne serverfout" });
  },
);

if (!isPassenger) {
  app.listen(port, () => {
    console.log(`Bugtracker API listening on http://localhost:${port}`);
  });
}

export default app;

import fs from "fs";
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
import { isProduction } from "./lib/database-env.js";
import { PROJECT_ROOT, SERVER_ROOT } from "./lib/paths.js";

export function configureApp(app: express.Application): void {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const publicPath = path.join(PROJECT_ROOT, "public");
  const distPath = path.join(PROJECT_ROOT, "dist");
  const frontendPath = fs.existsSync(path.join(publicPath, "index.html"))
    ? publicPath
    : distPath;
  const serveFrontend =
    isProduction() && fs.existsSync(path.join(frontendPath, "index.html"));

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
    res.setHeader(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex",
    );
    next();
  });
  app.use("/uploads", express.static(path.join(SERVER_ROOT, "uploads")));

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api", feedbackRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/proxy", proxyRoutes);
  app.use("/api/screenshots", screenshotRoutes);

  if (serveFrontend) {
    app.use(express.static(frontendPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  }

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
}

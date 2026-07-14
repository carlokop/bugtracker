import "./paths.js";

export type AppEnv = "development" | "production";

export function getAppEnv(): AppEnv {
  const env = process.env.APP_ENV?.trim().toLowerCase();

  if (env === "production" || env === "prod") return "production";
  if (env === "development" || env === "dev") return "development";

  return "development";
}

export function isProduction(): boolean {
  return getAppEnv() === "production";
}

export function isMariaDbDatabase(): boolean {
  return isProduction();
}

function buildMariaDbUrl(): string {
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";
  const database = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";

  if (!host || !database || !user) {
    throw new Error(
      "In productie (APP_ENV=production) zijn DB_HOST, DB_NAME en DB_USER verplicht",
    );
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const auth = password
    ? `${encodedUser}:${encodedPassword}`
    : encodedUser;

  const ssl = process.env.DB_SSL?.trim().toLowerCase();
  let query = "";
  if (ssl === "true" || ssl === "require") {
    query = "?sslaccept=strict";
  }

  return `mysql://${auth}@${host}:${port}/${encodeURIComponent(database)}${query}`;
}

export function configureDatabaseEnv(): void {
  try {
    if (isProduction()) {
      process.env.DATABASE_URL = buildMariaDbUrl();
      return;
    }

    if (!process.env.DATABASE_URL?.trim()) {
      process.env.DATABASE_URL = "file:./dev.db";
    }
  } catch (error) {
    console.error("Database configuratie mislukt:", error);
  }
}

configureDatabaseEnv();

import type { NextFunction, Request, Response } from "express";
import { getUserFromSession } from "../lib/session.js";
import type { ApiUser } from "../lib/mappers.js";

declare global {
  namespace Express {
    interface Request {
      user?: ApiUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = req.signedCookies?.bugtracker_session as string | undefined;
  const user = await getUserFromSession(sessionId);

  if (!user) {
    res.status(401).json({ error: "Niet ingelogd" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: Array<"admin" | "client">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Niet ingelogd" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Geen toegang" });
      return;
    }

    next();
  };
}

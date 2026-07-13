import { randomBytes } from "crypto";
import type { Response } from "express";
import { prisma } from "./prisma.js";
import { toApiUser } from "./mappers.js";
import type { ApiUser } from "./mappers.js";

const SESSION_COOKIE = "bugtracker_session";
const SESSION_DAYS = 30;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export async function createSession(
  userId: string,
  res: Response,
): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { id, userId, expiresAt },
  });

  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    signed: true,
  });

  // Ensure secret is loaded at startup
  getSessionSecret();
}

export async function destroySession(
  sessionId: string,
  res: Response,
): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
  res.clearCookie(SESSION_COOKIE);
}

export async function getUserFromSession(
  sessionId: string | undefined,
): Promise<ApiUser | null> {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return toApiUser(session.user);
}

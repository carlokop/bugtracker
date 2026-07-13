import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { verifyPassword } from "../lib/password.js";
import {
  createSession,
  destroySession,
  getUserFromSession,
} from "../lib/session.js";
import { toApiUser } from "../lib/mappers.js";
import { AppError } from "../lib/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldige invoer" });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Ongeldig e-mailadres of wachtwoord" });
    return;
  }

  await createSession(user.id, res);
  res.json({ user: toApiUser(user) });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const sessionId = req.signedCookies?.bugtracker_session as string | undefined;
  if (sessionId) {
    await destroySession(sessionId, res);
  } else {
    res.clearCookie("bugtracker_session");
  }
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const sessionId = req.signedCookies?.bugtracker_session as string | undefined;
  const user = await getUserFromSession(sessionId);

  if (!user) {
    res.status(401).json({ error: "Niet ingelogd" });
    return;
  }

  res.json({ user });
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  if (!req.user || req.user.role !== "admin") {
    throw new AppError("Geen toegang", 403);
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  res.json({ users: users.map(toApiUser) });
}

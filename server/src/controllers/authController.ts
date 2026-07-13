import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "../lib/password.js";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
  validatePasswordResetToken,
} from "../lib/passwordReset.js";
import { isMailConfigured } from "../lib/mail.js";
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    message: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten`,
  }),
});

const FORGOT_PASSWORD_MESSAGE =
  "Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met instructies.";

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

  if (!user) {
    res.status(401).json({ error: "Ongeldig e-mailadres of wachtwoord" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({
      error:
        "Je wachtwoord is nog niet ingesteld. Gebruik de link in je uitnodigingsmail of vraag een reset aan.",
    });
    return;
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
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

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  if (!isMailConfigured()) {
    throw new AppError(
      "Wachtwoord reset is momenteel niet beschikbaar. Neem contact op met de beheerder.",
      503,
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    try {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error("Wachtwoord-reset e-mail mislukt:", error);
    }
  }

  res.json({ message: FORGOT_PASSWORD_MESSAGE });
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const record = await validatePasswordResetToken(parsed.data.token);
  if (!record) {
    throw new AppError("Deze link is ongeldig of verlopen", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  res.json({ ok: true });
}

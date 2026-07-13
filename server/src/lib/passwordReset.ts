import crypto from "crypto";
import { prisma } from "./prisma.js";
import { isMailConfigured, sendEmail } from "./mail.js";
import { AppError } from "./errors.js";

const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_HOURS = 24;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getResetUrl(token: string): string {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

export function requireMailConfigured(): void {
  if (!isMailConfigured()) {
    throw new AppError(
      "E-mail is niet geconfigureerd (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAIL_FROM)",
      503,
    );
  }
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

export async function sendPasswordSetupEmail(
  email: string,
  token: string,
  projectName?: string,
): Promise<void> {
  const url = getResetUrl(token);
  const subject = projectName
    ? `Welkom bij Bugtracker — ${projectName}`
    : "Welkom bij Bugtracker — stel je wachtwoord in";

  const intro = projectName
    ? `Je bent uitgenodigd voor het project "${projectName}" in Bugtracker.`
    : "Er is een account voor je aangemaakt in Bugtracker.";

  const text = `${intro}

Klik op de onderstaande link om je wachtwoord in te stellen. De link is ${TOKEN_EXPIRY_HOURS} uur geldig.

${url}

Heb je deze uitnodiging niet verwacht? Negeer deze e-mail dan.`;

  const html = `<p>${intro}</p>
<p>Klik op de onderstaande knop om je wachtwoord in te stellen. De link is ${TOKEN_EXPIRY_HOURS} uur geldig.</p>
<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Wachtwoord instellen</a></p>
<p style="color:#666;font-size:14px;">Of kopieer deze link: <a href="${url}">${url}</a></p>
<p style="color:#666;font-size:14px;">Heb je deze uitnodiging niet verwacht? Negeer deze e-mail dan.</p>`;

  await sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const url = getResetUrl(token);
  const subject = "Bugtracker — wachtwoord resetten";

  const text = `Je hebt een wachtwoordreset aangevraagd voor je Bugtracker-account.

Klik op de onderstaande link om een nieuw wachtwoord in te stellen. De link is ${TOKEN_EXPIRY_HOURS} uur geldig.

${url}

Heb je dit niet aangevraagd? Negeer deze e-mail dan. Je wachtwoord blijft ongewijzigd.`;

  const html = `<p>Je hebt een wachtwoordreset aangevraagd voor je Bugtracker-account.</p>
<p>Klik op de onderstaande knop om een nieuw wachtwoord in te stellen. De link is ${TOKEN_EXPIRY_HOURS} uur geldig.</p>
<p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Wachtwoord resetten</a></p>
<p style="color:#666;font-size:14px;">Of kopieer deze link: <a href="${url}">${url}</a></p>
<p style="color:#666;font-size:14px;">Heb je dit niet aangevraagd? Negeer deze e-mail dan. Je wachtwoord blijft ongewijzigd.</p>`;

  await sendEmail({ to: email, subject, text, html });
}

export async function sendPasswordResetForUser(userId: string): Promise<void> {
  requireMailConfigured();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Gebruiker niet gevonden", 404);
  }

  const token = await createPasswordResetToken(userId);
  await sendPasswordResetEmail(user.email, token);
}

import { prisma } from "./prisma.js";
import { toPrismaNotificationType } from "./mappers.js";
import type { ApiNotification } from "./mappers.js";
import { isMailConfigured, sendEmail } from "./mail.js";

interface NotificationEmailOptions {
  subject: string;
  text: string;
  html: string;
}

interface NotifyOptions {
  sendEmail?: boolean;
  email?: NotificationEmailOptions;
}

function getFeedbackDeepLink(feedbackId: string): string {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  return `${frontendUrl}/feedback/${feedbackId}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BUG_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In behandeling",
  in_review: "Ter goedkeuring",
  done: "Gedaan",
};

const FEATURE_STATUS_LABELS: Record<string, string> = {
  requested: "Aangevraagd",
  approved: "Goedgekeurd",
  in_progress: "In ontwikkeling",
  delivered: "Opgeleverd",
  accepted: "Geaccepteerd",
};

function getStatusLabel(type: "BUG" | "FEATURE", status: string): string {
  const labels = type === "BUG" ? BUG_STATUS_LABELS : FEATURE_STATUS_LABELS;
  return labels[status] ?? status;
}

export function buildCommentEmail(input: {
  projectName?: string;
  authorName: string;
  commentText: string;
  feedbackId: string;
  feedbackTitle: string;
}): NotificationEmailOptions {
  const link = getFeedbackDeepLink(input.feedbackId);
  const subject = input.projectName
    ? `[${input.projectName}] Nieuwe reactie`
    : "Nieuwe reactie op feedback";

  const text = `${input.authorName} heeft gereageerd op "${input.feedbackTitle}":

"${input.commentText}"

Bekijk en reageer in de app:
${link}`;

  const html = `<p><strong>${escapeHtml(input.authorName)}</strong> heeft gereageerd op <strong>${escapeHtml(input.feedbackTitle)}</strong>:</p>
<blockquote style="margin:1em 0;padding:0.75em 1em;border-left:3px solid #2563eb;background:#f8fafc;">${escapeHtml(input.commentText)}</blockquote>
<p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Bekijk in de app</a></p>
<p style="color:#666;font-size:14px;">Of open deze link: <a href="${link}">${link}</a></p>`;

  return { subject, text, html };
}

export function buildStatusChangeEmail(input: {
  projectName?: string;
  changerName: string;
  feedbackId: string;
  feedbackTitle: string;
  newStatus: string;
}): NotificationEmailOptions {
  const link = getFeedbackDeepLink(input.feedbackId);
  const subject = input.projectName
    ? `[${input.projectName}] Status gewijzigd`
    : "Status van feedback gewijzigd";

  const text = `${input.changerName} heeft de status gewijzigd naar "${input.newStatus}" voor "${input.feedbackTitle}".

Bekijk in de app:
${link}`;

  const html = `<p><strong>${escapeHtml(input.changerName)}</strong> heeft de status gewijzigd naar <strong>${escapeHtml(input.newStatus)}</strong> voor <strong>${escapeHtml(input.feedbackTitle)}</strong>.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Bekijk in de app</a></p>
<p style="color:#666;font-size:14px;">Of open deze link: <a href="${link}">${link}</a></p>`;

  return { subject, text, html };
}

export async function createNotification(
  userId: string,
  type: ApiNotification["type"],
  referenceId: string,
  message: string,
  options?: NotifyOptions,
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: toPrismaNotificationType(type),
      referenceId,
      message,
    },
  });

  if (options?.sendEmail && options.email && isMailConfigured()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: options.email.subject,
          text: options.email.text,
          html: options.email.html,
        });
      } catch (error) {
        console.error("E-mail versturen mislukt:", error);
      }
    }
  }

  return notification;
}

export async function notifyUsers(
  userIds: Iterable<string>,
  type: ApiNotification["type"],
  referenceId: string,
  message: string,
  options?: NotifyOptions,
) {
  const uniqueIds = [...new Set(userIds)];
  await Promise.all(
    uniqueIds.map((userId) =>
      createNotification(userId, type, referenceId, message, options),
    ),
  );
}

export async function notifyProjectMembers(
  projectId: string,
  excludeUserId: string,
  type: ApiNotification["type"],
  referenceId: string,
  message: string,
  options?: NotifyOptions,
) {
  const [members, project] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { adminId: true, name: true },
    }),
  ]);

  const userIds = new Set<string>();
  members.forEach((m) => userIds.add(m.userId));
  if (project?.adminId) userIds.add(project.adminId);
  userIds.delete(excludeUserId);

  await notifyUsers(userIds, type, referenceId, message, options);
}

export async function notifyFeedbackStakeholders(input: {
  feedbackItemId: string;
  projectId: string;
  createdBy: string;
  excludeUserId: string;
  type: ApiNotification["type"];
  message: string;
  options?: NotifyOptions;
}) {
  const [project, commenters] = await Promise.all([
    prisma.project.findUnique({
      where: { id: input.projectId },
      select: { adminId: true },
    }),
    prisma.feedbackComment.findMany({
      where: { feedbackItemId: input.feedbackItemId },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const userIds = new Set<string>();
  userIds.add(input.createdBy);
  commenters.forEach((comment) => userIds.add(comment.userId));
  if (project?.adminId) userIds.add(project.adminId);
  userIds.delete(input.excludeUserId);

  await notifyUsers(
    userIds,
    input.type,
    input.feedbackItemId,
    input.message,
    input.options,
  );
}

export { getStatusLabel };

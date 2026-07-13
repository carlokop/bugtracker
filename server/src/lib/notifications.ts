import { prisma } from "./prisma.js";
import { toPrismaNotificationType } from "./mappers.js";
import type { ApiNotification } from "./mappers.js";
import { isMailConfigured, sendEmail } from "./mail.js";

export async function createNotification(
  userId: string,
  type: ApiNotification["type"],
  referenceId: string,
  message: string,
  emailSubject?: string,
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: toPrismaNotificationType(type),
      referenceId,
      message,
    },
  });

  if (isMailConfigured()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: emailSubject ?? message,
          text: message,
        });
      } catch (error) {
        console.error("E-mail versturen mislukt:", error);
      }
    }
  }

  return notification;
}

export async function notifyProjectMembers(
  projectId: string,
  excludeUserId: string,
  type: ApiNotification["type"],
  referenceId: string,
  message: string,
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

  const emailSubject = project?.name
    ? `[${project.name}] ${message}`
    : message;

  await Promise.all(
    [...userIds].map((userId) =>
      createNotification(userId, type, referenceId, message, emailSubject),
    ),
  );
}

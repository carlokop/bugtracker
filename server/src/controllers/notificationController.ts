import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { toApiNotification } from "../lib/mappers.js";
import { AppError } from "../lib/errors.js";
import { getParam } from "../lib/params.js";

export async function listNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ notifications: notifications.map(toApiNotification) });
}

export async function markNotificationRead(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const id = getParam(req, "id");
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== req.user.id) {
    throw new AppError("Notificatie niet gevonden", 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.json({ notification: toApiNotification(updated) });
}

export async function markAllNotificationsRead(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });

  res.json({ ok: true });
}

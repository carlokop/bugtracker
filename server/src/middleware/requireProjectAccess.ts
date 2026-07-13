import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { getParam } from "../lib/params.js";

export async function requireProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projectId =
      getParam(req, "projectId") ||
      getParam(req, "id") ||
      (req.body?.projectId as string | undefined);

    if (!projectId) {
      throw new AppError("Project niet gevonden", 404);
    }

    if (!req.user) {
      res.status(401).json({ error: "Niet ingelogd" });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!project) {
      throw new AppError("Project niet gevonden", 404);
    }

    const hasAccess =
      req.user.role === "admin"
        ? project.adminId === req.user.id
        : project.members.some((m) => m.userId === req.user!.id);

    if (!hasAccess) {
      res.status(403).json({ error: "Geen toegang tot dit project" });
      return;
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function requireFeedbackAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const feedbackId = getParam(req, "id") || getParam(req, "feedbackId");
    if (!feedbackId) {
      throw new AppError("Feedback item niet gevonden", 404);
    }

    if (!req.user) {
      res.status(401).json({ error: "Niet ingelogd" });
      return;
    }

    const item = await prisma.feedbackItem.findUnique({
      where: { id: feedbackId },
      include: {
        project: {
          include: { members: { select: { userId: true } } },
        },
      },
    });

    if (!item) {
      throw new AppError("Feedback item niet gevonden", 404);
    }

    const project = item.project;
    const hasAccess =
      req.user.role === "admin"
        ? project.adminId === req.user.id
        : project.members.some((m) => m.userId === req.user!.id);

    if (!hasAccess) {
      res.status(403).json({ error: "Geen toegang tot dit feedback item" });
      return;
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
}

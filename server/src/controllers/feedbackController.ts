import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  toApiFeedbackComment,
  toApiFeedbackItem,
  toPrismaDeviceType,
} from "../lib/mappers.js";
import { AppError } from "../lib/errors.js";
import { notifyProjectMembers } from "../lib/notifications.js";
import { getParam } from "../lib/params.js";

const BOARD_STATUSES = ["open", "in_progress", "in_review", "done"] as const;
const FEATURE_STATUSES = [
  "requested",
  "approved",
  "in_progress",
  "delivered",
  "accepted",
] as const;

const deviceTypeSchema = z.enum(["desktop", "tablet", "mobile"]);

const createBugSchema = z.object({
  pageUrl: z.string().min(1),
  cssSelector: z.string().min(1),
  x: z.number(),
  y: z.number(),
  screenshotUrl: z.string().min(1),
  problemDescription: z.string().min(1),
  definitionOfDone: z.string().min(1),
  deviceType: deviceTypeSchema,
  linkedFeatureId: z.string().optional(),
});

const createFeatureSchema = z.object({
  problemDescription: z.string().min(1),
  definitionOfDone: z.string().min(1),
  deviceType: deviceTypeSchema,
  pageUrl: z.string().optional(),
  cssSelector: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  screenshotUrl: z.string().optional(),
});

const deliverFeatureSchema = z.object({
  pageUrl: z.string().min(1),
  cssSelector: z.string().min(1),
  x: z.number(),
  y: z.number(),
  screenshotUrl: z.string().min(1),
  deliveryDescription: z.string().min(1),
  deviceType: deviceTypeSchema,
});

const convertFeatureSchema = z.object({
  pageUrl: z.string().min(1),
  cssSelector: z.string().min(1),
  x: z.number(),
  y: z.number(),
  screenshotUrl: z.string().min(1),
  problemDescription: z.string().min(1),
  definitionOfDone: z.string().min(1),
  deviceType: deviceTypeSchema,
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
});

const addCommentSchema = z.object({
  text: z.string().min(1),
});

function validateStatus(type: "BUG" | "FEATURE", status: string): void {
  if (type === "BUG" && !BOARD_STATUSES.includes(status as (typeof BOARD_STATUSES)[number])) {
    throw new AppError("Ongeldige status voor bug", 400);
  }
  if (
    type === "FEATURE" &&
    !FEATURE_STATUSES.includes(status as (typeof FEATURE_STATUSES)[number])
  ) {
    throw new AppError("Ongeldige status voor feature", 400);
  }
}

export async function listFeedback(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req, "projectId");
  const { status, pageUrl, deviceType, type } = req.query;

  const items = await prisma.feedbackItem.findMany({
    where: {
      projectId,
      ...(type === "bug" || type === "feature"
        ? { type: type === "bug" ? "BUG" : "FEATURE" }
        : {}),
      ...(typeof status === "string" ? { status } : {}),
      ...(typeof pageUrl === "string" ? { pageUrl } : {}),
      ...(deviceType === "desktop" ||
      deviceType === "tablet" ||
      deviceType === "mobile"
        ? { deviceType: toPrismaDeviceType(deviceType) }
        : {}),
    },
    include: { creator: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  res.json({ items: items.map(toApiFeedbackItem) });
}

export async function getFeedbackCounts(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req, "projectId");
  const items = await prisma.feedbackItem.findMany({
    where: { projectId },
    select: { type: true, status: true },
  });

  const bugs = items.filter((i) => i.type === "BUG");
  const features = items.filter((i) => i.type === "FEATURE");

  res.json({
    counts: {
      bugs: {
        open: bugs.filter((i) => i.status === "open").length,
        in_progress: bugs.filter((i) => i.status === "in_progress").length,
        in_review: bugs.filter((i) => i.status === "in_review").length,
        done: bugs.filter((i) => i.status === "done").length,
      },
      features: {
        requested: features.filter((i) => i.status === "requested").length,
        approved: features.filter((i) => i.status === "approved").length,
        in_progress: features.filter((i) => i.status === "in_progress").length,
        delivered: features.filter((i) => i.status === "delivered").length,
        accepted: features.filter((i) => i.status === "accepted").length,
      },
    },
  });
}

export async function getFeedbackItem(
  req: Request,
  res: Response,
): Promise<void> {
  const id = getParam(req, "id");
  const item = await prisma.feedbackItem.findUnique({
    where: { id },
    include: { creator: { select: { name: true } } },
  });

  if (!item) {
    throw new AppError("Feedback item niet gevonden", 404);
  }

  res.json({ item: toApiFeedbackItem(item) });
}

export async function createBug(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const projectId = getParam(req, "projectId");
  const parsed = createBugSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const item = await prisma.feedbackItem.create({
    data: {
      projectId,
      type: "BUG",
      status: "open",
      problemDescription: parsed.data.problemDescription,
      definitionOfDone: parsed.data.definitionOfDone,
      deviceType: toPrismaDeviceType(parsed.data.deviceType),
      hasLocation: true,
      pageUrl: parsed.data.pageUrl,
      cssSelector: parsed.data.cssSelector,
      x: parsed.data.x,
      y: parsed.data.y,
      screenshotUrl: parsed.data.screenshotUrl,
      linkedFeatureId: parsed.data.linkedFeatureId,
      createdBy: req.user.id,
    },
  });

  await notifyProjectMembers(
    projectId,
    req.user.id,
    "new_bug",
    item.id,
    "Nieuwe bug gemeld",
  );

  res.status(201).json({ item: toApiFeedbackItem(item) });
}

export async function createFeature(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const projectId = getParam(req, "projectId");
  const parsed = createFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const hasLocation =
    parsed.data.pageUrl != null &&
    parsed.data.x != null &&
    parsed.data.y != null &&
    parsed.data.screenshotUrl != null;

  const item = await prisma.feedbackItem.create({
    data: {
      projectId,
      type: "FEATURE",
      status: "approved",
      problemDescription: parsed.data.problemDescription,
      definitionOfDone: parsed.data.definitionOfDone,
      deviceType: toPrismaDeviceType(parsed.data.deviceType),
      hasLocation,
      pageUrl: parsed.data.pageUrl ?? null,
      cssSelector: hasLocation ? (parsed.data.cssSelector ?? null) : null,
      x: hasLocation ? (parsed.data.x ?? null) : null,
      y: hasLocation ? (parsed.data.y ?? null) : null,
      screenshotUrl: hasLocation ? (parsed.data.screenshotUrl ?? null) : null,
      createdBy: req.user.id,
    },
  });

  await notifyProjectMembers(
    projectId,
    req.user.id,
    "new_feature",
    item.id,
    "Nieuwe feature aangemaakt",
  );

  res.status(201).json({ item: toApiFeedbackItem(item) });
}

export async function updateFeedbackStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const id = getParam(req, "id");
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const existing = await prisma.feedbackItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Feedback item niet gevonden", 404);
  }

  validateStatus(existing.type, parsed.data.status);

  const item = await prisma.feedbackItem.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  if (req.user) {
    await notifyProjectMembers(
      item.projectId,
      req.user.id,
      "status_change",
      item.id,
      `Status gewijzigd naar ${parsed.data.status}`,
    );
  }

  res.json({ item: toApiFeedbackItem(item) });
}

export async function deliverFeature(req: Request, res: Response): Promise<void> {
  const id = getParam(req, "id");
  const parsed = deliverFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const existing = await prisma.feedbackItem.findUnique({
    where: { id },
  });

  if (!existing || existing.type !== "FEATURE") {
    throw new AppError("Alleen features kunnen worden opgeleverd", 400);
  }

  if (existing.status !== "in_progress") {
    throw new AppError(
      "Alleen features in ontwikkeling kunnen worden opgeleverd",
      400,
    );
  }

  const item = await prisma.feedbackItem.update({
    where: { id },
    data: {
      status: "delivered",
      hasLocation: true,
      pageUrl: parsed.data.pageUrl,
      cssSelector: parsed.data.cssSelector,
      x: parsed.data.x,
      y: parsed.data.y,
      screenshotUrl: parsed.data.screenshotUrl,
      deliveryDescription: parsed.data.deliveryDescription,
      deviceType: toPrismaDeviceType(parsed.data.deviceType),
    },
  });

  res.json({ item: toApiFeedbackItem(item) });
}

export async function convertFeatureToBug(
  req: Request,
  res: Response,
): Promise<void> {
  const id = getParam(req, "id");
  const parsed = convertFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const existing = await prisma.feedbackItem.findUnique({
    where: { id },
  });

  if (!existing || existing.type !== "FEATURE") {
    throw new AppError("Alleen features kunnen worden omgezet naar een bug", 400);
  }

  if (existing.status !== "delivered") {
    throw new AppError(
      "Alleen opgeleverde features kunnen worden omgezet naar een bug",
      400,
    );
  }

  const item = await prisma.feedbackItem.update({
    where: { id },
    data: {
      type: "BUG",
      status: "open",
      problemDescription: parsed.data.problemDescription,
      definitionOfDone: parsed.data.definitionOfDone,
      deviceType: toPrismaDeviceType(parsed.data.deviceType),
      hasLocation: true,
      pageUrl: parsed.data.pageUrl,
      cssSelector: parsed.data.cssSelector,
      x: parsed.data.x,
      y: parsed.data.y,
      screenshotUrl: parsed.data.screenshotUrl,
      deliveryDescription: null,
    },
  });

  res.json({ item: toApiFeedbackItem(item) });
}

export async function deleteFeedback(req: Request, res: Response): Promise<void> {
  const id = getParam(req, "id");
  await prisma.feedbackItem.delete({ where: { id } });
  res.json({ ok: true });
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const id = getParam(req, "id");
  const comments = await prisma.feedbackComment.findMany({
    where: { feedbackItemId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ comments: comments.map(toApiFeedbackComment) });
}

export async function addComment(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const id = getParam(req, "id");
  const parsed = addCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const item = await prisma.feedbackItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError("Feedback item niet gevonden", 404);
  }

  const comment = await prisma.feedbackComment.create({
    data: {
      feedbackItemId: id,
      userId: req.user.id,
      text: parsed.data.text,
    },
    include: { user: { select: { name: true } } },
  });

  await notifyProjectMembers(
    item.projectId,
    req.user.id,
    "new_comment",
    item.id,
    "Nieuwe reactie op feedback",
  );

  res.status(201).json({ comment: toApiFeedbackComment(comment) });
}

export async function getBugsForFeature(
  req: Request,
  res: Response,
): Promise<void> {
  const id = getParam(req, "id");
  const items = await prisma.feedbackItem.findMany({
    where: {
      type: "BUG",
      linkedFeatureId: id,
    },
  });

  res.json({ items: items.map(toApiFeedbackItem) });
}

import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toApiProject, toApiUser } from "../lib/mappers.js";
import { AppError } from "../lib/errors.js";
import { getParam } from "../lib/params.js";
import {
  createPasswordResetToken,
  requireMailConfigured,
  sendPasswordResetForUser,
  sendPasswordSetupEmail,
} from "../lib/passwordReset.js";

const createProjectSchema = z.object({
  name: z.string().min(1),
  targetUrl: z.string().min(1),
  description: z.string().default(""),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  targetUrl: z.string().min(1).optional(),
  description: z.string().optional(),
  proxyAuthUser: z.string().nullable().optional(),
  proxyAuthPassword: z.string().nullable().optional(),
});

const createClientUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const updateClientUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
});

async function sendClientSetupEmail(
  userId: string,
  email: string,
  projectName: string,
): Promise<void> {
  requireMailConfigured();
  const token = await createPasswordResetToken(userId);
  await sendPasswordSetupEmail(email, token, projectName);
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  let projects;
  if (req.user.role === "admin") {
    projects = await prisma.project.findMany({
      where: { adminId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: { project: true },
    });
    projects = memberships.map((m) => m.project);
  }

  res.json({ projects: projects.map(toApiProject) });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: getParam(req, "id") },
  });

  if (!project) {
    throw new AppError("Project niet gevonden", 404);
  }

  res.json({ project: toApiProject(project) });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError("Niet ingelogd", 401);

  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      adminId: req.user.id,
    },
  });

  res.status(201).json({ project: toApiProject(project) });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const data: {
    name?: string;
    targetUrl?: string;
    description?: string;
    proxyAuthUser?: string | null;
    proxyAuthPassword?: string | null;
  } = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.targetUrl !== undefined) data.targetUrl = parsed.data.targetUrl;
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description;
  }
  if (parsed.data.proxyAuthUser !== undefined) {
    data.proxyAuthUser = parsed.data.proxyAuthUser;
  }
  if (parsed.data.proxyAuthPassword === null) {
    data.proxyAuthPassword = null;
  } else if (parsed.data.proxyAuthPassword) {
    data.proxyAuthPassword = parsed.data.proxyAuthPassword;
  }

  const project = await prisma.project.update({
    where: { id: getParam(req, "id") },
    data,
  });

  res.json({ project: toApiProject(project) });
}

export async function listProjectMembers(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req, "projectId");
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });

  res.json({ members: members.map((m) => toApiUser(m.user)) });
}

export async function createClientUser(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req, "projectId");
  const parsed = createClientUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  if (!project) {
    throw new AppError("Project niet gevonden", 404);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    include: {
      projectMembers: { where: { projectId } },
    },
  });

  if (existing) {
    if (existing.role !== "CLIENT") {
      throw new AppError("Er bestaat al een account met dit e-mailadres", 409);
    }

    if (existing.projectMembers.length > 0) {
      throw new AppError("Deze gebruiker heeft al toegang tot dit project", 409);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name ?? existing.name,
        passwordHash: null,
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    await sendClientSetupEmail(user.id, user.email, project.name);

    res.status(201).json({ user: toApiUser(user) });
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name ?? parsed.data.email.split("@")[0],
      passwordHash: null,
      role: "CLIENT",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
    },
  });

  await sendClientSetupEmail(user.id, user.email, project.name);

  res.status(201).json({ user: toApiUser(user) });
}

export async function updateClientUser(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = updateClientUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: getParam(req, "userId") },
  });

  if (!user || user.role !== "CLIENT") {
    throw new AppError("Gebruiker niet gevonden", 404);
  }

  if (parsed.data.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
        NOT: { id: user.id },
      },
    });
    if (emailTaken) {
      throw new AppError("Dit e-mailadres is al in gebruik", 409);
    }
  }

  const data: {
    email?: string;
    name?: string;
  } = {};

  if (parsed.data.email) data.email = parsed.data.email.toLowerCase();
  if (parsed.data.name) data.name = parsed.data.name;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  res.json({ user: toApiUser(updated) });
}

export async function sendClientPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req, "projectId");
  const userId = getParam(req, "userId");

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
    include: { user: true },
  });

  if (!membership || membership.user.role !== "CLIENT") {
    throw new AppError("Gebruiker niet gevonden", 404);
  }

  await sendPasswordResetForUser(userId);

  res.json({ ok: true, message: "Wachtwoord-reset e-mail verstuurd" });
}

export async function removeClientUser(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req, "projectId");
  const userId = getParam(req, "userId");
  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  res.json({ ok: true });
}

import { AppError } from "./errors.js";
import { prisma } from "./prisma.js";

export async function getProjectProxyCredentials(
  projectId: string | undefined,
  userId: string,
  role: string,
): Promise<{ user: string; pass: string } | null> {
  if (!projectId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  });

  if (!project) return null;

  const hasAccess =
    role === "admin"
      ? project.adminId === userId
      : project.members.some((m) => m.userId === userId);

  if (!hasAccess) {
    throw new AppError("Geen toegang tot dit project", 403);
  }

  if (!project.proxyAuthUser || !project.proxyAuthPassword) {
    return null;
  }

  return {
    user: project.proxyAuthUser,
    pass: project.proxyAuthPassword,
  };
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { getProjectProxyCredentials } from "../lib/projectProxyAuth.js";
import { capturePageScreenshot } from "../lib/screenshot.js";

const captureSchema = z.object({
  url: z.string().min(1),
  projectId: z.string().min(1),
  width: z.number().int().min(320).max(1920).optional(),
});

const uploadsDir = path.resolve(process.cwd(), "uploads");

export async function captureScreenshot(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new AppError("Niet ingelogd", 401);
  }

  const parsed = captureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const credentials = await getProjectProxyCredentials(
    parsed.data.projectId,
    req.user.id,
    req.user.role,
  );

  let buffer: Buffer;
  try {
    buffer = await capturePageScreenshot(
      parsed.data.url,
      parsed.data.width ?? 1280,
      credentials,
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Kon geen screenshot maken van deze pagina. Probeer het opnieuw.",
      502,
    );
  }

  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.png`;
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = process.env.PUBLIC_URL ?? "";
  res.status(201).json({
    url: baseUrl ? `${baseUrl}/uploads/${filename}` : `/uploads/${filename}`,
  });
}

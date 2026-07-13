import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";

const uploadSchema = z.object({
  dataUrl: z.string().min(1),
});

const uploadsDir = path.resolve(process.cwd(), "uploads");

export async function uploadScreenshot(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Ongeldige invoer", 400);
  }

  const match = parsed.data.dataUrl.match(
    /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/,
  );

  if (!match) {
    throw new AppError("Ongeldige screenshot data", 400);
  }

  const ext = match[1] === "jpeg" || match[1] === "jpg" ? "jpg" : match[1];
  const buffer = Buffer.from(match[2], "base64");
  const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  const baseUrl = process.env.PUBLIC_URL ?? "";
  res.status(201).json({
    url: baseUrl
      ? `${baseUrl}/uploads/${filename}`
      : `/uploads/${filename}`,
  });
}

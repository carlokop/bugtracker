import type { Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { getProjectProxyCredentials } from "../lib/projectProxyAuth.js";
import {
  rewriteCss,
  rewriteHtml,
  validateProxyUrl,
} from "../lib/proxy.js";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
};

function looksLikeHtml(buffer: Buffer, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  const start = buffer.toString("utf-8", 0, 256).trim().toLowerCase();
  return start.startsWith("<!doctype html") || start.startsWith("<html");
}

function proxyErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;color:#334155}
h1{font-size:1.25rem}p{line-height:1.6;color:#64748b}</style></head>
<body><h1>${title}</h1><p>${message}</p></body></html>`;
}

export async function proxyResource(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw new AppError("Niet ingelogd", 401);
  }

  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    throw new AppError("URL ontbreekt", 400);
  }

  const projectId =
    typeof req.query.projectId === "string" ? req.query.projectId : undefined;

  const targetUrl = validateProxyUrl(rawUrl);
  const credentials = await getProjectProxyCredentials(
    projectId,
    req.user.id,
    req.user.role,
  );

  const headers: Record<string, string> = { ...BROWSER_HEADERS };
  if (credentials) {
    const encoded = Buffer.from(
      `${credentials.user}:${credentials.pass}`,
    ).toString("base64");
    headers.Authorization = `Basic ${encoded}`;
  }

  let upstreamResponse: globalThis.Response;
  try {
    upstreamResponse = await fetch(targetUrl.href, {
      headers,
      redirect: "follow",
    });
  } catch {
    throw new AppError("Kon geen verbinding maken met de website", 502);
  }

  const contentType =
    upstreamResponse.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await upstreamResponse.arrayBuffer());

  res.setHeader(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet, noimageindex",
  );

  if (looksLikeHtml(buffer, contentType)) {
    const html = rewriteHtml(buffer.toString("utf-8"), targetUrl.href);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200);
    res.send(html);
    return;
  }

  if (!upstreamResponse.ok) {
    if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
      const html = proxyErrorPage(
        "Toegang geweigerd",
        credentials
          ? "De opgeslagen inloggegevens werden geweigerd. Controleer gebruikersnaam en wachtwoord onder Klanten → Staging-toegang."
          : 'Deze staging-omgeving vereist HTTP Basic Auth. Vul bij "Staging-toegang" op de Klanten-pagina de inloggegevens in.',
      );
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200);
      res.send(html);
      return;
    }

    throw new AppError(
      `Kon pagina niet laden (${upstreamResponse.status})`,
      upstreamResponse.status === 404 ? 404 : 502,
    );
  }

  if (contentType.includes("text/css")) {
    const css = rewriteCss(buffer.toString("utf-8"), targetUrl.href);
    res.setHeader("Content-Type", contentType);
    res.send(css);
    return;
  }

  res.setHeader("Content-Type", contentType);
  res.send(buffer);
}

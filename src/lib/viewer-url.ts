const MOCK_PATHS = ["/", "/contact"];

export function isMockPath(url: string): boolean {
  return MOCK_PATHS.includes(url);
}

/** Normaliseert gebruikersinvoer naar een bruikbare viewer-URL. */
export function normalizeViewerUrl(input: string, fallback?: string): string {
  const trimmed = input.trim();
  if (!trimmed) return fallback?.trim() || "/";

  if (trimmed.startsWith("/")) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

/** Laadt externe sites same-origin via de backend-proxy (voor iframe + screenshots). */
export function getProxyViewerSrc(pageUrl: string, projectId?: string): string {
  const normalized = normalizeViewerUrl(pageUrl);
  const params = new URLSearchParams({ url: normalized });
  if (projectId) params.set("projectId", projectId);
  return `/api/proxy?${params.toString()}`;
}

export function shouldUseProxy(pageUrl: string): boolean {
  return !isMockPath(pageUrl);
}

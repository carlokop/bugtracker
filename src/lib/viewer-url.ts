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

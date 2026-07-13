import { AppError } from "./errors.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

export function validateProxyUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new AppError("Ongeldige URL", 400);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new AppError("Alleen http en https zijn toegestaan", 400);
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIpv4(hostname)) {
    throw new AppError("Deze URL mag niet via de proxy worden geladen", 403);
  }

  return url;
}

export function buildProxyPath(targetUrl: string): string {
  return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
}

function toAbsoluteUrl(raw: string, base: URL): string | null {
  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("blob:")
  ) {
    return null;
  }

  try {
    return new URL(trimmed, base).href;
  } catch {
    return null;
  }
}

function rewriteAttributeUrls(
  html: string,
  base: URL,
  attribute: "href" | "src" | "action",
): string {
  const pattern = new RegExp(
    `(\\s${attribute}\\s*=\\s*)(["'])(.*?)\\2`,
    "gi",
  );

  return html.replace(pattern, (_match, prefix, quote, value) => {
    const absolute = toAbsoluteUrl(value, base);
    if (!absolute) return `${prefix}${quote}${value}${quote}`;
    return `${prefix}${quote}${buildProxyPath(absolute)}${quote}`;
  });
}

function stripEmbeddingGuards(html: string): string {
  return html
    .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
    .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");
}

const NAVIGATION_SCRIPT = `<script>(function(){document.addEventListener("click",function(e){var a=e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||h.indexOf("/api/proxy?url=")===-1)return;e.preventDefault();try{var u=new URL(h,location.origin).searchParams.get("url");if(u)parent.postMessage({type:"bugtracker-navigate",url:u},"*");}catch(err){}},true);})();</script>`;

export function rewriteHtml(html: string, pageUrl: string): string {
  const base = new URL(pageUrl);
  let result = stripEmbeddingGuards(html);
  result = rewriteAttributeUrls(result, base, "href");
  result = rewriteAttributeUrls(result, base, "src");
  result = rewriteAttributeUrls(result, base, "action");

  if (result.includes("</head>")) {
    result = result.replace("</head>", `${NAVIGATION_SCRIPT}</head>`);
  } else {
    result = NAVIGATION_SCRIPT + result;
  }

  return result;
}

export function rewriteCss(css: string, cssUrl: string): string {
  const base = new URL(cssUrl);
  return css.replace(/url\((["']?)(.*?)\1\)/gi, (_match, quote, value) => {
    const absolute = toAbsoluteUrl(value, base);
    if (!absolute) return `url(${quote}${value}${quote})`;
    return `url(${quote}${buildProxyPath(absolute)}${quote})`;
  });
}

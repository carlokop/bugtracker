import { AppError } from "./errors.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

const URL_ATTRIBUTES = ["href", "src", "action", "poster", "data-src"] as const;

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

export function buildProxyPath(
  targetUrl: string,
  projectId?: string,
): string {
  const params = new URLSearchParams({ url: targetUrl });
  if (projectId) params.set("projectId", projectId);
  return `/api/proxy?${params.toString()}`;
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

function proxyUrl(raw: string, base: URL, projectId?: string): string | null {
  const absolute = toAbsoluteUrl(raw, base);
  if (!absolute) return null;
  return buildProxyPath(absolute, projectId);
}

function rewriteQuotedAttributeUrls(
  html: string,
  base: URL,
  attribute: string,
  projectId?: string,
): string {
  const pattern = new RegExp(
    `(\\s${attribute}\\s*=\\s*)(["'])(.*?)\\2`,
    "gi",
  );

  return html.replace(pattern, (_match, prefix, quote, value) => {
    const proxied = proxyUrl(value, base, projectId);
    if (!proxied) return `${prefix}${quote}${value}${quote}`;
    return `${prefix}${quote}${proxied}${quote}`;
  });
}

function rewriteUnquotedAttributeUrls(
  html: string,
  base: URL,
  attribute: string,
  projectId?: string,
): string {
  const pattern = new RegExp(
    `(\\s${attribute}\\s*=\\s*)(\\/[^\\s>"']+)`,
    "gi",
  );

  return html.replace(pattern, (_match, prefix, value) => {
    const proxied = proxyUrl(value, base, projectId);
    if (!proxied) return `${prefix}${value}`;
    return `${prefix}${proxied}`;
  });
}

function rewriteSrcset(html: string, base: URL, projectId?: string): string {
  const pattern = /(\ssrcset\s*=\s*)(["'])(.*?)\2/gi;

  return html.replace(pattern, (_match, prefix, quote, value) => {
    const rewritten = value.replace(
      /([^\s,]+)(\s+[\d.]+[wx])?/g,
      (part: string, urlPart: string, descriptor = "") => {
        const proxied = proxyUrl(urlPart, base, projectId);
        return proxied ? `${proxied}${descriptor}` : part;
      },
    );
    return `${prefix}${quote}${rewritten}${quote}`;
  });
}

function stripEmbeddingGuards(html: string): string {
  return html
    .replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
    .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");
}

function buildRuntimeScript(origin: string, projectId?: string): string {
  const projectIdLiteral = JSON.stringify(projectId ?? "");
  const originLiteral = JSON.stringify(origin);

  return `<script>(function(){var O=${originLiteral},PID=${projectIdLiteral};function P(u){if(!u||u.indexOf("data:")===0||u.indexOf("blob:")===0||u.indexOf("javascript:")===0||u.indexOf("#")===0||u.indexOf("/api/proxy?")===0)return u;try{var a=new URL(u,O);if(a.protocol!=="http:"&&a.protocol!=="https:")return u;var q="/api/proxy?url="+encodeURIComponent(a.href);if(PID)q+="&projectId="+encodeURIComponent(PID);return q}catch(e){return u}}var of=window.fetch;window.fetch=function(i,n){if(typeof i==="string")i=P(i);else if(i instanceof Request)i=new Request(P(i.url),i);return of.call(this,i,n)};var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=P(u);return ox.apply(this,arguments)};document.addEventListener("click",function(e){var a=e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(!h||h.indexOf("/api/proxy?url=")===-1)return;e.preventDefault();try{var u=new URL(h,location.origin).searchParams.get("url");if(u)parent.postMessage({type:"bugtracker-navigate",url:u},"*")}catch(err){}},true)})();</script>`;
}

export function rewriteHtml(
  html: string,
  pageUrl: string,
  projectId?: string,
): string {
  const base = new URL(pageUrl);
  let result = stripEmbeddingGuards(html);

  for (const attribute of URL_ATTRIBUTES) {
    result = rewriteQuotedAttributeUrls(result, base, attribute, projectId);
    result = rewriteUnquotedAttributeUrls(result, base, attribute, projectId);
  }
  result = rewriteSrcset(result, base, projectId);

  const runtimeScript = buildRuntimeScript(base.origin, projectId);
  if (result.includes("</head>")) {
    result = result.replace("</head>", `${runtimeScript}</head>`);
  } else {
    result = runtimeScript + result;
  }

  return result;
}

export function rewriteCss(
  css: string,
  cssUrl: string,
  projectId?: string,
): string {
  const base = new URL(cssUrl);
  return css.replace(/url\((["']?)(.*?)\1\)/gi, (_match, quote, value) => {
    const proxied = proxyUrl(value, base, projectId);
    if (!proxied) return `url(${quote}${value}${quote})`;
    return `url(${quote}${proxied}${quote})`;
  });
}

export function rewriteJs(
  js: string,
  jsUrl: string,
  projectId?: string,
): string {
  const base = new URL(jsUrl);

  let result = js.replace(
    /(import\s*(?:\([^)]*\)|[\w*{}\s,]+)\s*from\s*)(["'])(.*?)\2/g,
    (_match, prefix, quote, value) => {
      const proxied = proxyUrl(value, base, projectId);
      if (!proxied) return `${prefix}${quote}${value}${quote}`;
      return `${prefix}${quote}${proxied}${quote}`;
    },
  );

  result = result.replace(
    /(import\s*)(["'])(.*?)\2/g,
    (_match, prefix, quote, value) => {
      const proxied = proxyUrl(value, base, projectId);
      if (!proxied) return `${prefix}${quote}${value}${quote}`;
      return `${prefix}${quote}${proxied}${quote}`;
    },
  );

  result = result.replace(
    /(import\s*\(\s*)(["'])(.*?)\2(\s*\))/g,
    (_match, prefix, quote, value, suffix) => {
      const proxied = proxyUrl(value, base, projectId);
      if (!proxied) return `${prefix}${quote}${value}${quote}${suffix}`;
      return `${prefix}${quote}${proxied}${quote}${suffix}`;
    },
  );

  return result;
}

export function isScriptLikeRequest(
  targetUrl: URL,
  contentType: string,
): boolean {
  const path = targetUrl.pathname.toLowerCase();
  if (contentType.includes("javascript")) return true;
  if (contentType.includes("ecmascript")) return true;
  return (
    path.endsWith(".js") ||
    path.endsWith(".mjs") ||
    path.endsWith(".cjs") ||
    path.endsWith(".jsx") ||
    path.endsWith(".ts") ||
    path.endsWith(".tsx")
  );
}

export function isStylesheetRequest(
  targetUrl: URL,
  contentType: string,
): boolean {
  const path = targetUrl.pathname.toLowerCase();
  if (contentType.includes("text/css")) return true;
  return path.endsWith(".css");
}

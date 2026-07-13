import { describe, expect, it } from "vitest";
import {
  getProxyViewerSrc,
  isMockPath,
  normalizeViewerUrl,
  shouldUseProxy,
} from "@/lib/viewer-url";

describe("isMockPath", () => {
  it("returns true for known mock paths", () => {
    expect(isMockPath("/")).toBe(true);
    expect(isMockPath("/contact")).toBe(true);
  });

  it("returns false for unknown paths", () => {
    expect(isMockPath("/about")).toBe(false);
  });
});

describe("normalizeViewerUrl", () => {
  it("returns fallback for empty input", () => {
    expect(normalizeViewerUrl("", "/")).toBe("/");
  });

  it("keeps relative paths", () => {
    expect(normalizeViewerUrl("/contact")).toBe("/contact");
  });

  it("adds https to bare domains", () => {
    expect(normalizeViewerUrl("example.com")).toBe("https://example.com");
  });

  it("keeps full URLs", () => {
    expect(normalizeViewerUrl("https://example.com/page")).toBe(
      "https://example.com/page",
    );
  });
});

describe("getProxyViewerSrc", () => {
  it("wraps external URLs in the proxy path", () => {
    expect(getProxyViewerSrc("https://example.com")).toBe(
      "/api/proxy?url=https%3A%2F%2Fexample.com",
    );
  });

  it("includes projectId when provided", () => {
    expect(getProxyViewerSrc("https://example.com", "proj-1")).toBe(
      "/api/proxy?url=https%3A%2F%2Fexample.com&projectId=proj-1",
    );
  });
});

describe("shouldUseProxy", () => {
  it("uses proxy for external URLs only", () => {
    expect(shouldUseProxy("https://example.com")).toBe(true);
    expect(shouldUseProxy("/")).toBe(false);
  });
});

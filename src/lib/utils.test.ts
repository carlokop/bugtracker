import { describe, expect, it } from "vitest";
import { cn, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatDate", () => {
  it("formats ISO dates in Dutch locale", () => {
    const formatted = formatDate("2026-07-13T10:30:00.000Z");
    expect(formatted).toMatch(/13/);
    expect(formatted).toMatch(/2026/);
  });
});

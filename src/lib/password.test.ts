import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  getPasswordLengthError,
  isPasswordLongEnough,
} from "@/lib/password";

describe("password policy", () => {
  it("requires at least 12 characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(isPasswordLongEnough("short")).toBe(false);
    expect(isPasswordLongEnough("a".repeat(12))).toBe(true);
  });

  it("returns Dutch error message", () => {
    expect(getPasswordLengthError()).toBe(
      "Wachtwoord moet minimaal 12 tekens bevatten",
    );
  });
});

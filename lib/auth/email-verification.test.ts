import { describe, expect, it } from "vitest";

import {
  createEmailVerificationSecret,
  evaluateEmailVerificationToken,
  hashEmailVerificationToken
} from "./email-verification";

describe("email verification tokens", () => {
  it("stores only a hash of the raw token", () => {
    const secret = createEmailVerificationSecret();

    expect(secret.tokenHash).not.toBe(secret.token);
    expect(hashEmailVerificationToken(secret.token)).toBe(secret.tokenHash);
  });

  it("accepts a fresh unused token", () => {
    const now = new Date("2026-06-11T10:00:00.000Z");
    const expiresAt = new Date("2026-06-11T11:00:00.000Z");

    expect(evaluateEmailVerificationToken({ usedAt: null, expiresAt }, now)).toEqual({ ok: true });
  });

  it("rejects expired tokens", () => {
    const now = new Date("2026-06-11T10:00:00.000Z");
    const expiresAt = new Date("2026-06-11T09:59:00.000Z");

    expect(evaluateEmailVerificationToken({ usedAt: null, expiresAt }, now)).toEqual({
      ok: false,
      code: "TOKEN_EXPIRED"
    });
  });

  it("rejects used tokens", () => {
    const now = new Date("2026-06-11T10:00:00.000Z");
    const expiresAt = new Date("2026-06-11T11:00:00.000Z");
    const usedAt = new Date("2026-06-11T10:05:00.000Z");

    expect(evaluateEmailVerificationToken({ usedAt, expiresAt }, now)).toEqual({
      ok: false,
      code: "TOKEN_USED"
    });
  });
});

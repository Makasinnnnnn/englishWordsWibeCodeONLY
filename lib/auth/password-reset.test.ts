import { describe, expect, it } from "vitest";

import { createPasswordResetSecret, evaluatePasswordResetToken, hashPasswordResetToken } from "./password-reset";

describe("password reset tokens", () => {
  it("hashes reset tokens", () => {
    const secret = createPasswordResetSecret();

    expect(secret.tokenHash).not.toBe(secret.token);
    expect(hashPasswordResetToken(secret.token)).toBe(secret.tokenHash);
  });

  it("rejects expired tokens", () => {
    const now = new Date("2026-06-09T10:00:00.000Z");
    const expiresAt = new Date("2026-06-09T09:59:59.000Z");

    expect(evaluatePasswordResetToken({ usedAt: null, expiresAt }, now)).toEqual({
      ok: false,
      code: "TOKEN_EXPIRED"
    });
  });

  it("rejects used tokens", () => {
    const now = new Date("2026-06-09T10:00:00.000Z");
    const expiresAt = new Date("2026-06-09T10:30:00.000Z");
    const usedAt = new Date("2026-06-09T10:01:00.000Z");

    expect(evaluatePasswordResetToken({ usedAt, expiresAt }, now)).toEqual({
      ok: false,
      code: "TOKEN_USED"
    });
  });
});

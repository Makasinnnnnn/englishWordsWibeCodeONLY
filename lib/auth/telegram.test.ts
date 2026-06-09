import { describe, expect, it, vi } from "vitest";

import { calculateTelegramHash, type TelegramAuthPayload, verifyTelegramAuth } from "./telegram";

const botToken = "telegram-test-token-for-hash-tests";

function signedPayload(overrides: Partial<TelegramAuthPayload> = {}): TelegramAuthPayload {
  const payload: TelegramAuthPayload = {
    id: "42",
    first_name: "Test",
    username: "test_user",
    auth_date: Math.floor(Date.now() / 1000),
    hash: "",
    ...overrides
  };

  return {
    ...payload,
    hash: calculateTelegramHash(payload, botToken)
  };
}

describe("Telegram auth verification", () => {
  it("accepts a valid payload", () => {
    vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));

    expect(verifyTelegramAuth(signedPayload(), botToken)).toBe(true);

    vi.useRealTimers();
  });

  it("rejects an invalid hash", () => {
    vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));

    expect(verifyTelegramAuth({ ...signedPayload(), hash: "bad-hash" }, botToken)).toBe(false);

    vi.useRealTimers();
  });

  it("rejects expired auth data", () => {
    vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));

    const oldPayload = signedPayload({ auth_date: Math.floor(Date.now() / 1000) - 90_000 });

    expect(verifyTelegramAuth(oldPayload, botToken)).toBe(false);

    vi.useRealTimers();
  });

  it("rejects a missing hash", () => {
    vi.setSystemTime(new Date("2026-06-09T10:00:00.000Z"));

    expect(verifyTelegramAuth({ ...signedPayload(), hash: "" }, botToken)).toBe(false);

    vi.useRealTimers();
  });
});

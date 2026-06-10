import { describe, expect, it } from "vitest";

import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  telegramBotStartSchema,
  telegramBotTokenSchema
} from "./auth-schemas";

describe("auth validation schemas", () => {
  it("accepts a valid email login", () => {
    expect(loginSchema.safeParse({ email: "USER@example.com", password: "anything" }).success).toBe(true);
  });

  it("rejects invalid registration email", () => {
    expect(
      registerSchema.safeParse({
        email: "not-an-email",
        password: "StrongPass123",
        confirmPassword: "StrongPass123"
      }).success
    ).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(
      registerSchema.safeParse({
        email: "user@example.com",
        password: "password",
        confirmPassword: "password"
      }).success
    ).toBe(false);
  });

  it("rejects password mismatch", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "a".repeat(40),
        password: "StrongPass123",
        confirmPassword: "StrongPass124"
      }).success
    ).toBe(false);
  });

  it("defaults bot start mode to auth", () => {
    expect(telegramBotStartSchema.parse({})).toEqual({ mode: "auth" });
  });

  it("accepts a safe Telegram bot token value", () => {
    const token = "abcDEF123_-abcDEF123_-abcDEF123_-";

    expect(telegramBotTokenSchema.parse({ token })).toEqual({ token });
  });

  it("rejects malformed Telegram bot token values", () => {
    expect(telegramBotTokenSchema.safeParse({ token: "../secret" }).success).toBe(false);
    expect(telegramBotTokenSchema.safeParse({ token: "short" }).success).toBe(false);
  });
});

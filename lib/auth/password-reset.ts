import { createOpaqueToken, hashOpaqueToken } from "./tokens";

export type PasswordResetTokenState =
  | { ok: true }
  | { ok: false; code: "TOKEN_NOT_FOUND" | "TOKEN_USED" | "TOKEN_EXPIRED" };

export function getPasswordResetTtlMinutes() {
  const configured = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30);
  return Number.isFinite(configured) && configured > 0 ? configured : 30;
}

export function createPasswordResetSecret() {
  const token = createOpaqueToken();

  return {
    token,
    tokenHash: hashPasswordResetToken(token)
  };
}

export function hashPasswordResetToken(token: string) {
  return hashOpaqueToken(token);
}

export function getPasswordResetExpiry(from = new Date()) {
  return new Date(from.getTime() + getPasswordResetTtlMinutes() * 60 * 1000);
}

export function evaluatePasswordResetToken(
  token: { usedAt: Date | null; expiresAt: Date } | null,
  now = new Date()
): PasswordResetTokenState {
  if (!token) {
    return { ok: false, code: "TOKEN_NOT_FOUND" };
  }

  if (token.usedAt) {
    return { ok: false, code: "TOKEN_USED" };
  }

  if (token.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: "TOKEN_EXPIRED" };
  }

  return { ok: true };
}

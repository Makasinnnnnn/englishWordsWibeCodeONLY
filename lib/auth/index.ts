export { authError, authOk, authValidationError, type AuthErrorCode } from "./api";
export { hashPassword, verifyPassword } from "./password";
export {
  clearSession,
  createSession,
  destroyAllUserSessions,
  destroySession,
  getCurrentUser,
  getSessionCookieOptions,
  requireUser,
  sessionCookieName,
  type AuthUser
} from "./session";
export { createOpaqueToken, hashOpaqueToken } from "./tokens";

export function normalizeAuthEmail(email: string) {
  const value = email.trim().toLowerCase();

  if (!value.includes("@")) {
    return `${value}@local.uchi-slovo`;
  }

  return value;
}

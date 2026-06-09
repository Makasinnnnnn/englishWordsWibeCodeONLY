import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "TELEGRAM_AUTH_FAILED"
  | "TOKEN_EXPIRED"
  | "INTERNAL_ERROR";

export function authOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function authError(code: AuthErrorCode, message: string, status = 400, issues?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message
      },
      issues
    },
    { status }
  );
}

export function authValidationError(error: ZodError) {
  return authError("VALIDATION_ERROR", "Проверьте данные формы", 400, error.flatten());
}

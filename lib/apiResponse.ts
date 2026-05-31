import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

type ApiErrorOptions = {
  status?: number;
  code?: string;
  issues?: unknown;
};

export function apiError(message: string, options: ApiErrorOptions = {}) {
  return NextResponse.json(
    {
      error: message,
      code: options.code,
      issues: options.issues
    },
    { status: options.status ?? 500 }
  );
}

export function validationError(error: ZodError) {
  return apiError("Invalid request data", {
    status: 400,
    code: "VALIDATION_ERROR",
    issues: error.flatten()
  });
}

export function isPrismaNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export function isPrismaUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

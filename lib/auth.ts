import { randomBytes, timingSafeEqual, pbkdf2Sync } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const sessionCookieName = "word_trainer_session";

const sessionMaxAgeDays = 30;
const passwordIterations = 120_000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

export type AuthUser = Pick<User, "id" | "email">;

function normalizeEmail(email: string) {
  const value = email.trim().toLowerCase();

  if (!value.includes("@")) {
    return `${value}@local.uchi-slovo`;
  }

  return value;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest).toString("hex");

  return `pbkdf2:${passwordIterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, iterationsValue, salt, hash] = storedHash.split(":");

  if (method !== "pbkdf2" || !iterationsValue || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsValue);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest);
  const expected = Buffer.from(hash, "hex");

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSession() {
  const token = cookies().get(sessionCookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookies().delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export function normalizeAuthEmail(email: string) {
  return normalizeEmail(email);
}

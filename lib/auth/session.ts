import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";

export const sessionCookieName = "word_trainer_session";

export type AuthUser = Pick<User, "id" | "email" | "username" | "displayName" | "avatarUrl"> & {
  hasPassword: boolean;
};

export function getSessionTtlDays() {
  const configured = Number(process.env.SESSION_TTL_DAYS ?? 30);
  return Number.isFinite(configured) && configured > 0 ? configured : 30;
}

export function getSessionCookieOptions(expiresAt: Date) {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    expires: expiresAt
  };
}

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashOpaqueToken(token),
      userId,
      expiresAt
    }
  });

  cookies().set(sessionCookieName, token, getSessionCookieOptions(expiresAt));
}

export async function destroySession() {
  const token = cookies().get(sessionCookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashOpaqueToken(token) } });
  }

  cookies().delete(sessionCookieName);
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          passwordHash: true
        }
      }
    }
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.deleteMany({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.displayName,
    avatarUrl: session.user.avatarUrl,
    hasPassword: Boolean(session.user.passwordHash)
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const clearSession = destroySession;

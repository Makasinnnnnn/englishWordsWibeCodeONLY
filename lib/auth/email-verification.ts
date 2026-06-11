import { buildEmailVerificationUrl, sendEmailVerificationEmail } from "../email/mailer";
import { prisma } from "../prisma";

import { createOpaqueToken, hashOpaqueToken } from "./tokens";

export type EmailVerificationResult =
  | { ok: true; userId: string }
  | { ok: false; code: "TOKEN_INVALID" | "TOKEN_EXPIRED" | "TOKEN_USED" };

export type EmailVerificationTokenState =
  | { ok: true }
  | { ok: false; code: "TOKEN_INVALID" | "TOKEN_USED" | "TOKEN_EXPIRED" };

export function getEmailVerificationTtlMinutes() {
  const configured = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES ?? 1440);
  return Number.isFinite(configured) && configured > 0 ? configured : 1440;
}

export function hashEmailVerificationToken(token: string) {
  return hashOpaqueToken(token);
}

export function createEmailVerificationSecret() {
  const token = createOpaqueToken();

  return {
    token,
    tokenHash: hashEmailVerificationToken(token)
  };
}

export function getEmailVerificationExpiry(from = new Date()) {
  return new Date(from.getTime() + getEmailVerificationTtlMinutes() * 60 * 1000);
}

export function evaluateEmailVerificationToken(
  token: { usedAt: Date | null; expiresAt: Date } | null,
  now = new Date()
): EmailVerificationTokenState {
  if (!token) {
    return { ok: false, code: "TOKEN_INVALID" };
  }

  if (token.usedAt) {
    return { ok: false, code: "TOKEN_USED" };
  }

  if (token.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: "TOKEN_EXPIRED" };
  }

  return { ok: true };
}

export async function createEmailVerificationToken(userId: string) {
  const { token, tokenHash } = createEmailVerificationSecret();
  const expiresAt = getEmailVerificationExpiry();

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function sendVerificationForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true }
  });

  if (!user?.email || user.emailVerifiedAt) {
    return { sent: false };
  }

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }]
    }
  });

  const { token, expiresAt } = await createEmailVerificationToken(userId);
  await sendEmailVerificationEmail(user.email, buildEmailVerificationUrl(token));

  return { sent: true, expiresAt };
}

export async function verifyEmailToken(token: string): Promise<EmailVerificationResult> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashEmailVerificationToken(token) },
    include: {
      user: {
        select: { id: true }
      }
    }
  });

  if (!verificationToken) {
    return { ok: false, code: "TOKEN_INVALID" };
  }

  const tokenState = evaluateEmailVerificationToken(verificationToken);

  if (!tokenState.ok) {
    return { ok: false, code: tokenState.code };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerifiedAt: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() }
    })
  ]);

  return { ok: true, userId: verificationToken.user.id };
}

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { getTelegramDisplayName } from "./telegram";

export type TelegramProfile = {
  id: string | number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
};

const authUserSelect = {
  id: true,
  email: true,
  displayName: true
} satisfies Prisma.UserSelect;

export async function findOrCreateUserForTelegram(profile: TelegramProfile) {
  const telegramId = String(profile.id);
  const displayName = getTelegramDisplayName({
    first_name: profile.first_name ?? undefined,
    last_name: profile.last_name ?? undefined,
    username: profile.username ?? undefined
  });

  const existingTelegram = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { user: true }
  });

  if (existingTelegram) {
    return prisma.user.update({
      where: { id: existingTelegram.userId },
      data: {
        displayName: existingTelegram.user.displayName ?? displayName,
        avatarUrl: profile.photo_url ?? existingTelegram.user.avatarUrl,
        telegram: {
          update: {
            username: profile.username ?? null,
            firstName: profile.first_name ?? null,
            lastName: profile.last_name ?? null,
            photoUrl: profile.photo_url ?? null
          }
        }
      },
      select: authUserSelect
    });
  }

  try {
    return await prisma.user.create({
      data: {
        email: null,
        passwordHash: null,
        displayName,
        avatarUrl: profile.photo_url ?? null,
        telegram: {
          create: {
            telegramId,
            username: profile.username ?? null,
            firstName: profile.first_name ?? null,
            lastName: profile.last_name ?? null,
            photoUrl: profile.photo_url ?? null
          }
        }
      },
      select: authUserSelect
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const linkedTelegram = await prisma.telegramAccount.findUnique({
        where: { telegramId },
        include: { user: true }
      });

      if (linkedTelegram) {
        return prisma.user.update({
          where: { id: linkedTelegram.userId },
          data: {
            displayName: linkedTelegram.user.displayName ?? displayName,
            avatarUrl: profile.photo_url ?? linkedTelegram.user.avatarUrl
          },
          select: authUserSelect
        });
      }
    }

    throw error;
  }
}

export async function linkTelegramProfileToUser(userId: string, profile: TelegramProfile) {
  const telegramId = String(profile.id);
  const existingByTelegramId = await prisma.telegramAccount.findUnique({
    where: { telegramId }
  });

  if (existingByTelegramId && existingByTelegramId.userId !== userId) {
    return { ok: false as const, code: "TELEGRAM_TAKEN" as const };
  }

  const existingForUser = await prisma.telegramAccount.findUnique({
    where: { userId }
  });

  if (existingForUser && existingForUser.telegramId !== telegramId) {
    return { ok: false as const, code: "USER_HAS_TELEGRAM" as const };
  }

  const telegram = await prisma.telegramAccount.upsert({
    where: { userId },
    update: {
      telegramId,
      username: profile.username ?? null,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      photoUrl: profile.photo_url ?? null
    },
    create: {
      userId,
      telegramId,
      username: profile.username ?? null,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      photoUrl: profile.photo_url ?? null
    }
  });

  return { ok: true as const, telegram };
}

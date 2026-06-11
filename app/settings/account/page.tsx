import { AccountSettingsClient } from "@/components/auth/AccountSettingsClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      emailVerifiedAt: true,
      displayName: true,
      passwordHash: true,
      telegram: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          photoUrl: true
        }
      }
    }
  });

  return (
    <AccountSettingsClient
      telegramBotUsername={process.env.TELEGRAM_BOT_USERNAME}
      account={{
        email: account?.email ?? null,
        emailVerifiedAt: account?.emailVerifiedAt?.toISOString() ?? null,
        displayName: account?.displayName ?? null,
        hasPassword: Boolean(account?.passwordHash),
        telegram: account?.telegram ?? null
      }}
    />
  );
}

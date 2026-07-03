import { SettingsClient } from "@/components/SettingsClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();
  const cardDictionaries = await prisma.dictionary.findMany({
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      isDefault: true,
      _count: {
        select: { words: true }
      }
    }
  });

  return <SettingsClient cardDictionaries={cardDictionaries} />;
}

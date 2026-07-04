import { SettingsClient } from "@/components/SettingsClient";
import { requireUser } from "@/lib/auth";
import { getActiveDictionaryForUser } from "@/lib/dictionaries/active";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const activeDictionary = await getActiveDictionaryForUser(user.id);
  const cardDictionaries = await prisma.dictionary.findMany({
    orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      version: true,
      isDefault: true,
      _count: {
        select: { words: true }
      }
    }
  });

  return <SettingsClient cardDictionaries={cardDictionaries} activeDictionaryId={activeDictionary?.id ?? null} />;
}

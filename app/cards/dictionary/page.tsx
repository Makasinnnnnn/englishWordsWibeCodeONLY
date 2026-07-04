import {
  CardDictionaryClient,
  type CardDictionarySetItem,
  type CardDictionaryWordItem
} from "@/components/CardDictionaryClient";
import { EmptyState } from "@/components/EmptyState";
import { requireUser } from "@/lib/auth";
import { getActiveDictionaryForUser } from "@/lib/dictionaries/active";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CardDictionaryPage() {
  const user = await requireUser();
  const activeDictionary = await getActiveDictionaryForUser(user.id);

  if (!activeDictionary) {
    return <EmptyState title="Словарь карточек не найден" description="Скачайте словарь в настройках." />;
  }

  const dictionary = await prisma.dictionary.findUnique({
    where: { id: activeDictionary.id },
    include: {
      words: {
        where: { archived: false },
        orderBy: [{ position: "asc" }, { english: "asc" }],
        include: {
          progress: {
            where: { userId: user.id },
            take: 1
          }
        }
      },
      cardSets: {
        where: { userId: user.id },
        orderBy: [{ isToday: "desc" }, { updatedAt: "desc" }],
        include: {
          words: {
            orderBy: [{ position: "asc" }, { addedAt: "asc" }],
            include: { word: true }
          }
        }
      }
    }
  });

  if (!dictionary) {
    return <EmptyState title="Словарь карточек не найден" description="Выберите или скачайте словарь в настройках." />;
  }

  const words: CardDictionaryWordItem[] = dictionary.words.map((word) => ({
    id: word.id,
    dictionaryId: word.dictionaryId,
    english: word.english,
    transcription: word.transcription,
    translation: word.translation,
    exampleEn: word.exampleEn,
    exampleRu: word.exampleRu,
    source: word.source,
    position: word.position,
    status: word.progress[0]?.status ?? "new"
  }));
  const sets: CardDictionarySetItem[] = dictionary.cardSets.map((set) => ({
    id: set.id,
    dictionaryId: set.dictionaryId,
    title: set.title,
    description: set.description,
    isToday: set.isToday,
    words: set.words.map((item) => ({
      id: item.id,
      dictionaryWordId: item.dictionaryWordId,
      position: item.position,
      word: {
        id: item.word.id,
        english: item.word.english,
        translation: item.word.translation,
        transcription: item.word.transcription
      }
    }))
  }));

  return (
    <CardDictionaryClient
      dictionary={{
        id: dictionary.id,
        title: dictionary.title,
        description: dictionary.description,
        sourceName: dictionary.sourceName
      }}
      initialWords={words}
      initialSets={sets}
    />
  );
}

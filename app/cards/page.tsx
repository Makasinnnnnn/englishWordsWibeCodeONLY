import { EmptyState } from "@/components/EmptyState";
import { SwipeTrainingWorkspace } from "@/components/SwipeTrainingWorkspace";
import { requireUser } from "@/lib/auth";
import { getDefaultCardDeck } from "@/lib/cards/deck";
import type { CardDirectionMode } from "@/lib/cards/queue";

export const dynamic = "force-dynamic";

export default async function CardsPage({
  searchParams
}: {
  searchParams?: { learned?: string; set?: string; all?: string; direction?: string };
}) {
  const user = await requireUser();
  const includeLearnedOnce = searchParams?.learned === "1";
  const directionMode: CardDirectionMode =
    searchParams?.direction === "en-ru" || searchParams?.direction === "ru-en" ? searchParams.direction : "auto";
  const deck = await getDefaultCardDeck(user.id, {
    includeLearnedOnce,
    cardSetId: searchParams?.set,
    useTodaySet: searchParams?.all !== "1",
    directionMode
  });

  if (!deck) {
    return (
      <EmptyState
        title="Словарь карточек не найден"
        description="Запустите seed, чтобы добавить дефолтный B2-словарь для свайп-карточек."
      />
    );
  }

  return <SwipeTrainingWorkspace deck={deck} includeLearnedOnce={includeLearnedOnce} directionMode={directionMode} />;
}

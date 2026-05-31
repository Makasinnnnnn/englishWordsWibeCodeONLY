import { notFound } from "next/navigation";

import { WordCard } from "@/components/WordCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type WordPageProps = {
  params: {
    id: string;
  };
};

export default async function WordPage({ params }: WordPageProps) {
  const user = await requireUser();
  const word = await prisma.word.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!word) {
    notFound();
  }

  return <WordCard word={serializeWord(word)} detail />;
}

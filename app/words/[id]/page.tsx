import { notFound } from "next/navigation";

import { WordCard } from "@/components/WordCard";
import { prisma } from "@/lib/prisma";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type WordPageProps = {
  params: {
    id: string;
  };
};

export default async function WordPage({ params }: WordPageProps) {
  const word = await prisma.word.findUnique({
    where: { id: params.id }
  });

  if (!word) {
    notFound();
  }

  return <WordCard word={serializeWord(word)} detail />;
}

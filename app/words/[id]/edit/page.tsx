import { notFound } from "next/navigation";

import { WordForm } from "@/components/WordForm";
import { prisma } from "@/lib/prisma";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type EditWordPageProps = {
  params: {
    id: string;
  };
};

export default async function EditWordPage({ params }: EditWordPageProps) {
  const word = await prisma.word.findUnique({
    where: { id: params.id }
  });

  if (!word) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="text-sm text-slate-500">Редактирование</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{word.english}</h2>
      </div>
      <WordForm initialWord={serializeWord(word)} />
    </div>
  );
}

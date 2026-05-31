import { notFound } from "next/navigation";

import { TrainingWorkspace } from "@/components/TrainingWorkspace";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type TrainingWordPageProps = {
  params: {
    id: string;
  };
};

export default async function TrainingWordPage({ params }: TrainingWordPageProps) {
  const user = await requireUser();
  const words = serializeWords(await prisma.word.findMany({ where: { userId: user.id } }));

  if (!words.some((word) => word.id === params.id)) {
    notFound();
  }

  return <TrainingWorkspace initialWords={words} startWordId={params.id} />;
}

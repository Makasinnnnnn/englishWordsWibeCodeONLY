import { TrainingWorkspace } from "@/components/TrainingWorkspace";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const words = serializeWords(await prisma.word.findMany());

  return <TrainingWorkspace initialWords={words} />;
}

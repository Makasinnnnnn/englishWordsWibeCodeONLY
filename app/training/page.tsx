import { TrainingWorkspace } from "@/components/TrainingWorkspace";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await requireUser();
  const words = serializeWords(await prisma.word.findMany({ where: { userId: user.id } }));

  return <TrainingWorkspace initialWords={words} />;
}

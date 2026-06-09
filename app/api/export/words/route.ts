import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { wordsToCsv } from "@/lib/import-export/csv";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const words = serializeWords(
      await prisma.word.findMany({
        where: { userId: user.id },
        orderBy: [{ createdAt: "asc" }]
      })
    );

    return new Response(wordsToCsv(words), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="word-memory-trainer-export.csv"`
      }
    });
  } catch {
    return apiError("Failed to export words");
  }
}

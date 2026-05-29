import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { wordMutationSchema } from "@/lib/schemas";
import { serializeWord, serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export async function GET() {
  const words = await prisma.word.findMany({
    orderBy: [{ isLearned: "asc" }, { learningLevel: "asc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ words: serializeWords(words) });
}

export async function POST(request: NextRequest) {
  try {
    const payload = wordMutationSchema.parse(await request.json());
    const word = await prisma.word.create({
      data: payload
    });

    return NextResponse.json({ word: serializeWord(word) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid word data", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create word" }, { status: 500 });
  }
}

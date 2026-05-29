import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { wordUpdateSchema } from "@/lib/schemas";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const word = await prisma.word.findUnique({
    where: { id: params.id }
  });

  if (!word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  return NextResponse.json({ word: serializeWord(word) });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const payload = wordUpdateSchema.parse(await request.json());
    const word = await prisma.word.update({
      where: { id: params.id },
      data: payload
    });

    return NextResponse.json({ word: serializeWord(word) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid word data", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update word" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await prisma.word.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
  }
}

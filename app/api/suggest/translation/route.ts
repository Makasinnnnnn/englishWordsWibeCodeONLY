import { NextRequest, NextResponse } from "next/server";

import { suggestTranslation } from "@/lib/mockSuggestions";

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word") ?? "";
  const translation = suggestTranslation(word);

  return NextResponse.json({
    translation,
    message: translation ? "Mock translation found" : "Введите перевод вручную"
  });
}

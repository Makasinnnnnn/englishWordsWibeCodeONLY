import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { suggestTranslation } from "@/lib/mockSuggestions";

export async function GET(request: NextRequest) {
  try {
    const word = request.nextUrl.searchParams.get("word") ?? "";
    const translation = suggestTranslation(word);

    return NextResponse.json({
      translation,
      message: translation ? "Mock translation found" : "Введите перевод вручную"
    });
  } catch {
    return apiError("Failed to suggest translation");
  }
}

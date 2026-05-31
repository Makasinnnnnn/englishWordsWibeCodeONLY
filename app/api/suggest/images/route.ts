import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { suggestImages } from "@/lib/mockSuggestions";

export async function GET(request: NextRequest) {
  try {
    const word = request.nextUrl.searchParams.get("word") ?? "";
    const association = request.nextUrl.searchParams.get("association") ?? "";

    return NextResponse.json({
      images: suggestImages(word, association)
    });
  } catch {
    return apiError("Failed to suggest images");
  }
}

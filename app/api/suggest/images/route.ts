import { NextRequest, NextResponse } from "next/server";

import { suggestImages } from "@/lib/mockSuggestions";

export async function GET(request: NextRequest) {
  const word = request.nextUrl.searchParams.get("word") ?? "";
  const association = request.nextUrl.searchParams.get("association") ?? "";

  return NextResponse.json({
    images: suggestImages(word, association)
  });
}

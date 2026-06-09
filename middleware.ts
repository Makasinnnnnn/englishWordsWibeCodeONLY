import { NextRequest, NextResponse } from "next/server";

const sessionCookieName = "word_trainer_session";

const privatePrefixes = [
  "/words",
  "/training",
  "/settings",
  "/api/words",
  "/api/import",
  "/api/export",
  "/api/account"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);
  const isPrivate = pathname === "/" || privatePrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPrivate && !hasSessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Paths that should be accessible without locale prefix (for external validators like Google)
const REWRITE_PATHS = ["/privacy", "/terms"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (REWRITE_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/ko${pathname}`;
    return NextResponse.rewrite(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api, /_next, /_vercel
  // - files with extensions (e.g. favicon.ico, logo.png)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};

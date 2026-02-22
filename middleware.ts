import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ["/stocks", "/compare"];

function isProtectedRoute(pathnameWithoutLocale: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathnameWithoutLocale.startsWith(p))) {
    return true;
  }
  // /stock/[symbol] is protected, but /stock/[symbol]/analysis/** is public
  if (
    pathnameWithoutLocale.startsWith("/stock/") &&
    !pathnameWithoutLocale.includes("/analysis")
  ) {
    return true;
  }
  return false;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(ko|en)/, "") || "/";

  if (isProtectedRoute(pathnameWithoutLocale)) {
    // Check Auth.js session cookie
    const hasSession =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token");

    if (!hasSession) {
      const locale =
        pathname.match(/^\/(ko|en)/)?.[1] || routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api, /_next, /_vercel
  // - files with extensions (e.g. favicon.ico, logo.png)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};

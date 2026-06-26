import { clerkMiddleware } from "@repo/auth/proxy";
import { internationalizationMiddleware } from "@repo/internationalization/proxy";
import { type NextRequest, NextResponse } from "next/server";

const isAuthPage = (pathname: string) =>
  pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

const isApiPath = (pathname: string) =>
  pathname.startsWith("/api/") || pathname.startsWith("/.well-known/");

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // 1. Public infrastructure — webhooks, health checks, etc.
  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // 2. Signed out
  if (!userId) {
    // Auth pages are reachable; let i18n internally rewrite to /[locale]/...
    if (isAuthPage(pathname)) {
      return internationalizationMiddleware(req) ?? NextResponse.next();
    }
    // Everything else → /sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 3. Signed in & on an auth page → /dashboard
  if (isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Signed in & landing on root → /dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. Signed-in app routes — let i18n internally rewrite to /[locale]/...
  return internationalizationMiddleware(req) ?? NextResponse.next();
});

export const config = {
  matcher: [
    // Run for everything except _next internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|webm|mp4|mov)).*)",
    // Always run for API/trpc routes
    "/(api|trpc)(.*)",
  ],
};

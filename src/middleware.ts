import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware for FamCal
 *
 * Protects routes based on authentication status:
 * - /manage routes require PIN authentication
 * - Certain API routes require authentication
 * - Public routes are accessible without authentication
 */

// Routes that require PIN authentication
const PIN_PROTECTED_ROUTES = ["/manage"];

// API routes that require PIN authentication
const PIN_PROTECTED_API_ROUTES = [
  "/api/settings",
  "/api/family",
  "/api/chores",
  "/api/rewards",
  "/api/habits",
  "/api/schedule",
  "/api/shopping",
  "/api/tasks",
  "/api/photos",
  "/api/backup",
  "/api/auth/pin/change",
  "/api/audit",
];

// Public routes that don't require any authentication
const PUBLIC_ROUTES = [
  "/",
  "/manage/unlock",
  "/member", // Member portal for kids
  "/pos", // Point of Sale for NFC cards
  "/api/member", // Member API endpoint
  "/api/weather",
  "/api/calendar/events",
  "/api/calendar/status",
  "/api/calendar/sync",
  "/api/local-photos",
  "/api/auth/pin/status",
  "/api/auth/pin/verify",
  "/api/auth/pin/setup",
  "/api/points/balance", // Public for display purposes
  "/api/points/adjust", // Allow point adjustments from POS
  "/api/chores", // Allow chore completion from member portal
  "/api/rewards/redeem", // Allow reward redemption from member portal
  "/api/recipes", // Allow recipe rating from member portal
  "/api/meal-plan/today", // Allow viewing today's meals
];

// Routes that allow public GET requests (for dashboard widgets) but require PIN for modifications
const PUBLIC_READ_ROUTES = [
  "/api/family",
  "/api/shopping",
  "/api/tasks",
  "/api/habits",
  "/api/schedule",
  "/api/rewards",
  "/api/settings", // Dashboard needs to read settings for photo mode
];

// Static files and Next.js internals
const STATIC_PATHS = ["/_next", "/favicon.ico", "/avatars", "/uploads"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Allow GET requests on public read routes (dashboard widgets)
  if (request.method === "GET" && PUBLIC_READ_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Check PIN authentication for protected routes
  const pinSession = request.cookies.get("famcal-pin-session")?.value;

  // For /manage routes (except /manage/unlock)
  if (PIN_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (pathname === "/manage/unlock") {
      return NextResponse.next();
    }

    if (!pinSession) {
      // Redirect to unlock page
      const unlockUrl = new URL("/manage/unlock", request.url);
      unlockUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(unlockUrl);
    }

    // Validate session server-side by checking with API
    // For now, we trust the cookie exists - full validation happens in API routes
    return NextResponse.next();
  }

  // For PIN-protected API routes
  if (PIN_PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!pinSession) {
      return NextResponse.json(
        { error: "PIN authentication required" },
        { status: 401 }
      );
    }

    // Continue to API route - full validation happens in the route handler
    return NextResponse.next();
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

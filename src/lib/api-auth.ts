import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { validateSession } from "./pin-auth";
import { hasPermission, Permission, Role, isValidRole } from "./rbac";

export interface AuthContext {
  isAuthenticated: boolean;
  isPinAuthenticated: boolean;
  memberId: string | null;
  memberName: string | null;
  role: Role | null;
}

/**
 * Get authentication context from request
 * Checks both PIN session and member identification
 */
export async function getAuthContext(request?: NextRequest): Promise<AuthContext> {
  const context: AuthContext = {
    isAuthenticated: false,
    isPinAuthenticated: false,
    memberId: null,
    memberName: null,
    role: null,
  };

  try {
    // Check PIN session
    const cookieStore = await cookies();
    const pinToken = cookieStore.get("famcal-pin-session")?.value;

    if (pinToken) {
      const isValidPin = await validateSession(pinToken);
      if (isValidPin) {
        context.isPinAuthenticated = true;
        context.isAuthenticated = true;
        // PIN auth grants PARENT role
        context.role = "PARENT";
      }
    }

    // Check for member identification (from header or cookie)
    const memberId =
      request?.headers.get("x-member-id") ||
      cookieStore.get("famcal-member-id")?.value;

    if (memberId) {
      const member = await prisma.familyMember.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, role: true },
      });

      if (member && isValidRole(member.role)) {
        context.memberId = member.id;
        context.memberName = member.name;
        context.role = member.role as Role;
        context.isAuthenticated = true;
      }
    }
  } catch (error) {
    console.error("Error getting auth context:", error);
  }

  return context;
}

/**
 * Check if the current request has the required permission
 */
export async function checkPermission(
  request: NextRequest,
  permission: Permission
): Promise<{ allowed: boolean; context: AuthContext }> {
  const context = await getAuthContext(request);

  if (!context.isAuthenticated || !context.role) {
    return { allowed: false, context };
  }

  const allowed = hasPermission(context.role, permission);
  return { allowed, context };
}

/**
 * Require a specific permission - returns error response if not allowed
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<NextResponse | null> {
  const { allowed, context } = await checkPermission(request, permission);

  if (!allowed) {
    if (!context.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Permission denied", required: permission },
      { status: 403 }
    );
  }

  return null; // Permission granted
}

/**
 * Require PIN authentication (for /manage routes)
 */
export async function requirePinAuth(): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const pinToken = cookieStore.get("famcal-pin-session")?.value;

    if (!pinToken) {
      return NextResponse.json(
        { error: "PIN authentication required" },
        { status: 401 }
      );
    }

    const isValid = await validateSession(pinToken);
    if (!isValid) {
      return NextResponse.json(
        { error: "PIN session expired" },
        { status: 401 }
      );
    }

    return null; // Authentication valid
  } catch (error) {
    console.error("Error checking PIN auth:", error);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}

/**
 * Get client info from request for audit logging
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent");

  return { ipAddress, userAgent };
}

/**
 * Protected route types
 */
export const PROTECTED_ROUTES = {
  // Routes that require PIN authentication
  pinProtected: [
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
  ],
  // Routes that are public (no auth required)
  public: [
    "/api/weather",
    "/api/calendar/events",
    "/api/calendar/status",
    "/api/local-photos",
    "/api/auth/pin/status",
    "/api/auth/pin/verify",
    "/api/auth/pin/setup",
  ],
  // Routes that require specific permissions
  permissionRequired: {
    "/api/points/award": "points:award" as Permission,
    "/api/rewards/redemptions": "rewards:approve" as Permission,
    "/api/backup/restore": "backup:restore" as Permission,
    "/api/audit": "audit:view" as Permission,
  },
};

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  // Check if it's a public route
  if (PROTECTED_ROUTES.public.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Check if it's a PIN protected route
  if (PROTECTED_ROUTES.pinProtected.some((route) => pathname.startsWith(route))) {
    return true;
  }

  return false;
}

/**
 * Get required permission for a route
 */
export function getRequiredPermission(pathname: string): Permission | null {
  for (const [route, permission] of Object.entries(PROTECTED_ROUTES.permissionRequired)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }
  return null;
}

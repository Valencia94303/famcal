import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPin,
  isLockedOut,
  getLockoutRemainingSeconds,
  recordFailedAttempt,
  resetFailedAttempts,
  createPinSession,
  validateSession,
  deleteSession,
} from "@/lib/pin-auth";
import { cookies } from "next/headers";

// POST - Verify PIN and create session
export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      );
    }

    // Check if locked out
    if (await isLockedOut()) {
      const remaining = await getLockoutRemainingSeconds();
      return NextResponse.json(
        {
          error: "Account is temporarily locked",
          locked: true,
          lockoutRemaining: remaining,
        },
        { status: 403 }
      );
    }

    // Get stored hash
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
      select: { adminPinHash: true, pinEnabled: true },
    });

    if (!settings?.pinEnabled || !settings?.adminPinHash) {
      return NextResponse.json(
        { error: "PIN authentication is not configured" },
        { status: 400 }
      );
    }

    // Verify PIN
    const isValid = await verifyPin(pin, settings.adminPinHash);

    if (!isValid) {
      const result = await recordFailedAttempt();
      return NextResponse.json(
        {
          error: "Invalid PIN",
          remainingAttempts: result.remainingAttempts,
          locked: result.locked,
        },
        { status: 401 }
      );
    }

    // Reset failed attempts and create session
    await resetFailedAttempts();
    const session = await createPinSession();

    // Set session cookie
    // Note: secure is false to support local network access over HTTP
    const cookieStore = await cookies();
    cookieStore.set("famcal-pin-session", session.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "PIN verified successfully",
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}

// GET - Check if current session is valid
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("famcal-pin-session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const isValid = await validateSession(token);
    return NextResponse.json({ authenticated: isValid });
  } catch (error) {
    console.error("Error checking session:", error);
    return NextResponse.json({ authenticated: false });
  }
}

// DELETE - Logout (clear session)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("famcal-pin-session")?.value;

    if (token) {
      await deleteSession(token);
    }

    cookieStore.delete("famcal-pin-session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
